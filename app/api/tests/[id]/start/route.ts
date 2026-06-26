import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const test = await db.test.findUnique({
    where: { id: testId, status: "PUBLISHED" },
    include: {
      questions: {
        include: {
          question: {
            select: { id: true, text: true, options: true, topic: true, difficulty: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!test) return NextResponse.json({ error: "Test not found or not published" }, { status: 404 });

  const existing = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: session.user.id } },
    include: { answers: true },
  });

  if (existing) {
    if (existing.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "You have already submitted this test" }, { status: 409 });
    }

    const questionOrder = existing.questionOrder as string[];
    const orderedQuestions = questionOrder.map((qId) => {
      const tq = test.questions.find((q) => q.question.id === qId)!;
      return {
        ...tq.question,
        options: shuffleOptions(tq.question.options as string[], session.user.id, qId),
        marks: tq.marks,
      };
    });

    return NextResponse.json({
      attemptId: existing.id,
      questions: orderedQuestions,
      startedAt: existing.startedAt,
      durationMins: test.durationMins,
      savedAnswers: existing.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptions: a.selectedOptions,
      })),
    });
  }

  const questionIds = test.questions.map((q) => q.question.id);
  const shuffledIds = shuffleArray([...questionIds], session.user.id);

  const attempt = await db.attempt.create({
    data: {
      testId,
      studentId: session.user.id,
      questionOrder: shuffledIds,
      status: "IN_PROGRESS",
    },
  });

  const orderedQuestions = shuffledIds.map((qId) => {
    const tq = test.questions.find((q) => q.question.id === qId)!;
    return {
      ...tq.question,
      options: shuffleOptions(tq.question.options as string[], session.user.id, qId),
      marks: tq.marks,
    };
  });

  return NextResponse.json({
    attemptId: attempt.id,
    questions: orderedQuestions,
    startedAt: attempt.startedAt,
    durationMins: test.durationMins,
    savedAnswers: [],
  });
}

function shuffleArray(arr: string[], seed: string): string[] {
  const seeded = [...arr];
  let hash = 0;
  for (const c of seed) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
  for (let i = seeded.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
  }
  return seeded;
}

function shuffleOptions(options: string[], studentId: string, questionId: string): string[] {
  return shuffleArray(
    options.map((_, i) => String(i)),
    studentId + questionId
  ).map((i) => options[Number(i)]);
}
