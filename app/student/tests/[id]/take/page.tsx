import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { TestEngine } from "@/components/test/TestEngine";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Taking Test" };

export default async function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const userId = session.user.id;

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

  if (!test) notFound();

  const existingAttempt = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: userId } },
    include: { answers: true, answersCoding: true },
  });

  if (existingAttempt?.status === "SUBMITTED") {
    redirect(`/student/tests/${testId}/result`);
  }

  let attempt = existingAttempt;
  let questionOrder: string[];

  if (!attempt) {
    questionOrder = test.questions.map((q) => (q.question?.id || q.questionCoding?.id) as string);

    attempt = await db.attempt.create({
      data: {
        testId,
        studentId: userId,
        questionOrder,
        status: "IN_PROGRESS",
      },
      include: { answers: true, answersCoding: true },
    });
  } else {
    questionOrder = attempt.questionOrder as string[];
  }

  const orderedQuestions = questionOrder.map((qId) => {
    const tq = test.questions.find((q) => (q.question?.id === qId) || (q.questionCoding?.id === qId))!;
    if (tq.question) {
      return {
        type: "MCQ",
        id: tq.question.id,
        text: tq.question.text,
        options: tq.question.options as string[],
        topic: tq.question.topic,
        difficulty: tq.question.difficulty,
        marks: tq.marks,
      };
    }
    return {
      type: "CODING",
      id: tq.questionCoding!.id,
      title: tq.questionCoding!.title,
      description: tq.questionCoding!.description,
      language: tq.questionCoding!.language,
      starterCode: tq.questionCoding!.starterCode,
      topic: tq.questionCoding!.topic,
      difficulty: tq.questionCoding!.difficulty,
      testCases: (tq.questionCoding!.testCases as any[]).map(tc => ({
        input: tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
        isHidden: tc.isHidden
      })),
      marks: tq.marks,
    };
  });

  const savedAnswers = (attempt.answers as any[]).map((a) => ({
    questionId: a.questionId,
    selectedOptions: a.selectedOptions as number[],
  }));

  const savedCodingAnswers = ((attempt as any).answersCoding || []).map((a: any) => ({
    questionId: a.questionId,
    submittedCode: a.submittedCode as string,
    testCaseResults: a.testCaseResults as any[],
  }));

  return (
    <TestEngine
      testId={testId}
      attemptId={attempt.id}
      questions={orderedQuestions as any}
      startedAt={attempt.startedAt.toISOString()}
      durationMins={test.durationMins}
      initialAnswers={savedAnswers}
      initialCodingAnswers={savedCodingAnswers}
    />
  );
}
