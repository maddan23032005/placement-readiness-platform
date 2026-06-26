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
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!test) notFound();

  const existingAttempt = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: userId } },
    include: { answers: true },
  });

  if (existingAttempt?.status === "SUBMITTED") {
    redirect(`/student/tests/${testId}/result`);
  }

  let attempt = existingAttempt;
  let questionOrder: string[];

  if (!attempt) {
    const questionIds = test.questions.map((q) => q.question.id);
    questionOrder = shuffleArray([...questionIds], userId);

    attempt = await db.attempt.create({
      data: {
        testId,
        studentId: userId,
        questionOrder,
        status: "IN_PROGRESS",
      },
      include: { answers: true },
    });
  } else {
    questionOrder = attempt.questionOrder as string[];
  }

  const orderedQuestions = questionOrder.map((qId) => {
    const tq = test.questions.find((q) => q.question.id === qId)!;
    return {
      id: tq.question.id,
      text: tq.question.text,
      options: shuffleOptions(tq.question.options as string[], userId, qId),
      topic: tq.question.topic,
      difficulty: tq.question.difficulty,
      marks: tq.marks,
    };
  });

  const savedAnswers = (attempt.answers as { questionId: string; selectedOptions: unknown }[]).map((a) => ({
    questionId: a.questionId,
    selectedOptions: a.selectedOptions as number[],
  }));

  return (
    <TestEngine
      testId={testId}
      attemptId={attempt.id}
      questions={orderedQuestions}
      startedAt={attempt.startedAt.toISOString()}
      durationMins={test.durationMins}
      initialAnswers={savedAnswers}
    />
  );
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
