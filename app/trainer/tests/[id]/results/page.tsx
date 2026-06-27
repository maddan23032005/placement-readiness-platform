import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { AnalyticsCharts } from "./AnalyticsCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Test Analytics" };

export default async function TestResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const test = await db.test.findFirst({
    where: { id, createdById: session!.user.id },
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

  if (!test) notFound();

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

  const maxScore = test.questions.reduce((s, q) => s + q.marks, 0);
  const avgScore = results.length
    ? results.reduce((s, r) => s + r.totalScore, 0) / results.length
    : 0;

  const questionStats = test.questions.map((tq) => {
    const isCoding = !!tq.questionCoding;
    const qId = isCoding ? tq.questionCoding!.id : tq.question!.id;
    const qAnswers = isCoding 
      ? answersCoding.filter((a) => a.questionId === qId)
      : answers.filter((a) => a.questionId === qId);

    const correct = qAnswers.filter((a) => a.isCorrect).length;
    const text = isCoding ? tq.questionCoding!.title : tq.question!.text;
    
    return {
      questionId: qId,
      text: text.slice(0, 60) + (text.length > 60 ? "…" : ""),
      topic: isCoding ? tq.questionCoding!.topic : tq.question!.topic,
      total: qAnswers.length,
      correct,
      correctRate: qAnswers.length > 0 ? Math.round((correct / qAnswers.length) * 100) : 0,
      isCoding,
    };
  });

  const scoreBuckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}-${(i + 1) * 10}%`,
    count: 0,
  }));
  results.forEach((r) => {
    const pct = maxScore > 0 ? (r.totalScore / maxScore) * 100 : 0;
    scoreBuckets[Math.min(Math.floor(pct / 10), 9)].count += 1;
  });

  const passCount = results.filter((r) => (r.totalScore / r.maxScore) >= 0.6).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">{test.title}</h1>
          <p className="page-subtitle">Test analytics and results</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Submissions", value: results.length },
          { label: "Avg. Score", value: `${Math.round(avgScore * 10) / 10}` },
          { label: "Max Score", value: maxScore },
          { label: "Pass Rate (≥60%)", value: results.length > 0 ? `${Math.round((passCount / results.length) * 100)}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
          </div>
        ))}
      </div>

      <AnalyticsCharts scoreBuckets={scoreBuckets} questionStats={questionStats} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
          <span className="text-xs text-[hsl(var(--text-muted))]">Sorted by score</span>
        </CardHeader>
        {results.length === 0 ? (
          <p className="text-sm text-[hsl(var(--text-muted))] py-6 text-center">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const pct = Math.round((r.totalScore / r.maxScore) * 100);
                  const mins = Math.floor(r.timeTakenSecs / 60);
                  const secs = r.timeTakenSecs % 60;
                  return (
                    <tr key={r.id}>
                      <td className="text-[hsl(var(--text-muted))] font-medium">{i + 1}</td>
                      <td className="font-medium">{r.attempt.student.name}</td>
                      <td>{r.totalScore} / {r.maxScore}</td>
                      <td>
                        <span className={`font-semibold ${pct >= 60 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--error))]"}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="text-[hsl(var(--text-muted))]">{mins}m {secs}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
