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
          questionCoding: {
            select: { id: true, title: true, description: true, language: true, starterCode: true, topic: true, difficulty: true, testCases: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!test) return NextResponse.json({ error: "Test not found or not published" }, { status: 404 });

  const existing = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: session.user.id } },
    include: { answers: true, answersCoding: true },
  });

  if (existing) {
    if (existing.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "You have already submitted this test" }, { status: 409 });
    }

    const questionOrder = existing.questionOrder as string[];
    const orderedQuestions = questionOrder.map((qId) => {
      const tq = test.questions.find((q) => (q.question?.id === qId) || (q.questionCoding?.id === qId))!;
      if (tq.question) {
        return {
          type: "MCQ",
          ...tq.question,
          options: tq.question.options as string[],
          marks: tq.marks,
        };
      }
      return {
        type: "CODING",
        ...tq.questionCoding,
        testCases: (tq.questionCoding?.testCases as any[]).map(tc => ({
          input: tc.input,
          expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
          isHidden: tc.isHidden
        })),
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
      savedCodingAnswers: existing.answersCoding.map((a) => ({
        questionId: a.questionId,
        submittedCode: a.submittedCode,
        testCaseResults: a.testCaseResults,
      })),
    });
  }

  const questionIds = test.questions.map((q) => (q.question?.id || q.questionCoding?.id) as string);

  const attempt = await db.attempt.create({
    data: {
      testId,
      studentId: session.user.id,
      questionOrder: questionIds,
      status: "IN_PROGRESS",
    },
  });

  const orderedQuestions = questionIds.map((qId) => {
    const tq = test.questions.find((q) => (q.question?.id === qId) || (q.questionCoding?.id === qId))!;
    if (tq.question) {
      return {
        type: "MCQ",
        ...tq.question,
        options: tq.question.options as string[],
        marks: tq.marks,
      };
    }
    return {
      type: "CODING",
      ...tq.questionCoding,
      testCases: (tq.questionCoding?.testCases as any[]).map(tc => ({
        input: tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
        isHidden: tc.isHidden
      })),
      marks: tq.marks,
    };
  });

  return NextResponse.json({
    attemptId: attempt.id,
    questions: orderedQuestions,
    startedAt: attempt.startedAt,
    durationMins: test.durationMins,
    savedAnswers: [],
    savedCodingAnswers: [],
  });
}


