import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gradeAttempt, computePercentile } from "@/lib/grader";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testId } = await params;
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }


  const attempt = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: session.user.id } },
    include: { answers: true },
  });

  if (!attempt) return NextResponse.json({ error: "No attempt found" }, { status: 404 });

  // Idempotency: already submitted
  if (attempt.status !== "IN_PROGRESS") {
    const existing = await db.result.findUnique({ where: { attemptId: attempt.id } });
    return NextResponse.json({ result: existing, alreadySubmitted: true });
  }

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        include: { question: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const now = new Date();
  const timeTakenSecs = Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000);

  const { totalScore, maxScore, topicBreakdown, gradedAnswers, timeTakenSecs: tt } =
    gradeAttempt(attempt, test.questions, test, timeTakenSecs);

  const result = await db.$transaction(async (tx) => {
    for (const ga of gradedAnswers) {
      await tx.answerMCQ.updateMany({
        where: { attemptId: attempt.id, questionId: ga.questionId },
        data: { isCorrect: ga.isCorrect, marksAwarded: ga.marksAwarded },
      });
    }

    await tx.attempt.update({
      where: { id: attempt.id },
      data: { status: "SUBMITTED", submittedAt: now },
    });

    return tx.result.create({
      data: {
        attemptId: attempt.id,
        totalScore,
        maxScore,
        topicBreakdown,
        timeTakenSecs: tt,
      },
    });
  });

    // Update percentile async — doesn't block response
    computePercentile(attempt.id, testId, totalScore).then(async (percentile) => {
      await db.result.update({ where: { id: result.id }, data: { percentile } });
    }).catch(err => console.error("Percentile error:", err));

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[SUBMIT_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

