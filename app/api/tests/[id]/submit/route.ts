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
    include: { answers: true, answersCoding: true },
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
        include: { question: true, questionCoding: true },
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
      if (ga.isCorrect !== undefined) {
        // It could be an MCQ or Coding. The GradedAnswer interface might need updating.
        // But we only update MCQ answers in db.$transaction for now if we can't distinguish.
        // Actually, we can check if it's in attempt.answers or attempt.answersCoding.
        const isCoding = attempt.answersCoding?.some(a => a.questionId === ga.questionId);
        if (isCoding) {
          await tx.answerCoding.updateMany({
            where: { attemptId: attempt.id, questionId: ga.questionId },
            data: { isCorrect: ga.isCorrect, marksAwarded: ga.marksAwarded },
          });
        } else {
          await tx.answerMCQ.updateMany({
            where: { attemptId: attempt.id, questionId: ga.questionId },
            data: { isCorrect: ga.isCorrect, marksAwarded: ga.marksAwarded },
          });
        }
      }
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
        topicBreakdown: topicBreakdown as any,
        timeTakenSecs: tt,
      },
    });
  });

    // Update percentile async — doesn't block response
    computePercentile(attempt.id, testId, totalScore).then(async (percentile) => {
      await db.result.update({ where: { id: result.id }, data: { percentile } });
    }).catch(err => console.error("Percentile error:", err));

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("[SUBMIT_ERROR]", err);
    require('fs').writeFileSync('c:\\Users\\murug\\Desktop\\placement-readiness-platform\\submit_error.log', err.stack || err.message || String(err));
    return NextResponse.json({ error: err.message || "Internal server error", stack: err.stack }, { status: 500 });
  }
}

