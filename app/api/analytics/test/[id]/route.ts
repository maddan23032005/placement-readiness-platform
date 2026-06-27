import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const test = await db.test.findFirst({
    where: { id, createdById: session.user.id },
    include: {
      questions: {
        include: {
          question: { select: { id: true, text: true, topic: true } },
          questionCoding: { select: { id: true, title: true, topic: true } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await db.result.findMany({
    where: { attempt: { testId: id, status: "SUBMITTED" } },
    include: { attempt: { include: { student: { select: { id: true, name: true } } } } },
    orderBy: { totalScore: "desc" },
  });

  const answers = await db.answerMCQ.findMany({
    where: { attempt: { testId: id, status: "SUBMITTED" } },
    select: { questionId: true, isCorrect: true },
  });

  const answersCoding = await db.answerCoding.findMany({
    where: { attempt: { testId: id, status: "SUBMITTED" } },
    select: { questionId: true, isCorrect: true },
  });

  const questionStats = test.questions.map((tq) => {
    const isCoding = !!tq.questionCoding;
    const qId = isCoding ? tq.questionCoding!.id : tq.question!.id;
    const qAnswers = isCoding 
      ? answersCoding.filter((a) => a.questionId === qId)
      : answers.filter((a) => a.questionId === qId);

    const total = qAnswers.length;
    const correct = qAnswers.filter((a) => a.isCorrect).length;
    return {
      questionId: qId,
      text: isCoding ? tq.questionCoding!.title : tq.question!.text,
      topic: isCoding ? tq.questionCoding!.topic : tq.question!.topic,
      total,
      correct,
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
      isCoding,
    };
  });

  const scoreBuckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}-${(i + 1) * 10}%`,
    count: 0,
  }));

  results.forEach((r) => {
    const pct = r.maxScore > 0 ? (r.totalScore / r.maxScore) * 100 : 0;
    scoreBuckets[Math.min(Math.floor(pct / 10), 9)].count += 1;
  });

  const avgScore = results.length
    ? results.reduce((s, r) => s + r.totalScore, 0) / results.length
    : 0;

  return NextResponse.json({
    test: { id: test.id, title: test.title, maxScore: test.questions.reduce((s, q) => s + q.marks, 0) },
    results: results.map((r) => ({
      studentName: r.attempt.student.name,
      studentId: r.attempt.student.id,
      totalScore: r.totalScore,
      maxScore: r.maxScore,
      percentile: r.percentile,
      timeTakenSecs: r.timeTakenSecs,
    })),
    questionStats,
    scoreBuckets,
    avgScore: Math.round(avgScore * 10) / 10,
    totalSubmissions: results.length,
  });
}
