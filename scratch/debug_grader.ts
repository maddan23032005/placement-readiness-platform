import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { POST } from "../app/api/tests/[id]/submit/route";
import { NextRequest } from "next/server";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const attempt = await db.attempt.findFirst({
    orderBy: { startedAt: 'desc' }
  });

  if (!attempt) return;

  // Reset to IN_PROGRESS so it can be submitted
  await db.attempt.update({
    where: { id: attempt.id },
    data: { status: "IN_PROGRESS" }
  });
  
  // Delete the result we created previously
  await db.result.deleteMany({
    where: { attemptId: attempt.id }
  });

  // Since POST uses auth(), we can't easily mock auth() without mocking the module.
  // Instead of calling POST directly, let's just run the exact code from POST.
  
  const test = await db.test.findUnique({
    where: { id: attempt.testId },
    include: {
      questions: {
        include: { question: true },
        orderBy: { order: "asc" },
      },
    },
  });

  const { gradeAttempt } = await import("../lib/grader");
  
  const attemptWithAnswers = await db.attempt.findUnique({
    where: { id: attempt.id },
    include: { answers: true }
  });

  const now = new Date();
  const timeTakenSecs = Math.round((now.getTime() - attemptWithAnswers!.startedAt.getTime()) / 1000);

  const { totalScore, maxScore, topicBreakdown, gradedAnswers, timeTakenSecs: tt } =
    gradeAttempt(attemptWithAnswers as any, test!.questions, test as any, timeTakenSecs);

  console.log("Graded, running tx...");

  try {
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
          topicBreakdown: topicBreakdown as any,
          timeTakenSecs: tt,
        },
      });
    });
    console.log("Success!", result.id);
  } catch (e) {
    console.error("Tx error:", e);
  }
}

main().finally(() => db.$disconnect());
