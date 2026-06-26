import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { CheckCircle, XCircle, BarChart2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Test Result" };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const userId = session.user.id;

  const attempt = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: userId } },
    include: {
      result: true,
      test: { select: { title: true, negativeMarking: true } },
      answers: {
        include: {
          question: {
            select: { id: true, text: true, options: true, correctOptions: true, topic: true },
          },
        },
      },
    },
  });

  if (!attempt || attempt.status !== "SUBMITTED") redirect(`/student/tests/${testId}/take`);
  if (!attempt.result) notFound();

  const result = attempt.result;
  const pct = Math.round((result.totalScore / result.maxScore) * 100);
  const topicBreakdown = result.topicBreakdown as Record<string, {
    correct: number; total: number; score: number; maxScore: number
  }>;
  const mins = Math.floor(result.timeTakenSecs / 60);
  const secs = result.timeTakenSecs % 60;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/student/tests" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
          <ArrowLeft size={15} />
          Back to tests
        </Link>
      </div>

      {/* Score card */}
      <Card className="mb-6 text-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold",
          pct >= 75 ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]" :
          pct >= 50 ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]" :
          "bg-[hsl(var(--error)/0.1)] text-[hsl(var(--error))]"
        )}>
          {pct}%
        </div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-1">{attempt.test.title}</h1>
        <p className="text-sm text-[hsl(var(--text-secondary))] mb-6">
          {pct >= 75 ? "Excellent work!" : pct >= 50 ? "Good effort — keep practicing." : "Keep working at it — practice makes perfect."}
        </p>

        <div className="grid grid-cols-4 gap-4 border-t border-[hsl(var(--border))] pt-5">
          {[
            { label: "Score", value: result.totalScore },
            { label: "Max Score", value: result.maxScore },
            { label: "Percentile", value: result.percentile !== null ? `${result.percentile}th` : "—" },
            { label: "Time Taken", value: `${mins}m ${secs}s` },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-[hsl(var(--text-primary))]">{s.value}</p>
              <p className="text-xs text-[hsl(var(--text-muted))]">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Topic breakdown */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <BarChart2 size={17} className="text-[hsl(var(--brand))]" />
          Topic-wise Breakdown
        </h2>
        <div className="space-y-4">
          {Object.entries(topicBreakdown).map(([topic, data]) => {
            const topicPct = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
            return (
              <div key={topic}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[hsl(var(--text-primary))]">{topic}</span>
                  <span className="text-[hsl(var(--text-muted))]">
                    {data.correct}/{data.total} correct · {data.score}/{data.maxScore} marks
                  </span>
                </div>
                <div className="h-2 bg-[hsl(var(--surface-2))] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      topicPct >= 75 ? "bg-[hsl(var(--success))]" :
                      topicPct >= 50 ? "bg-[hsl(var(--warning))]" : "bg-[hsl(var(--error))]"
                    )}
                    style={{ width: `${Math.max(0, topicPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Answer review */}
      <Card>
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <CheckCircle size={17} className="text-[hsl(var(--brand))]" />
          Answer Review
        </h2>
        <div className="space-y-4">
          {attempt.answers.map((ans, i) => {
            const q = ans.question;
            const opts = q.options as string[];
            const correct = q.correctOptions as number[];
            const selected = ans.selectedOptions as number[];
            const isCorrect = ans.isCorrect;

            return (
              <div key={ans.id} className={cn(
                "border rounded-xl p-5",
                isCorrect ? "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.04)]" :
                selected.length === 0 ? "border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]" :
                "border-[hsl(var(--error)/0.3)] bg-[hsl(var(--error)/0.04)]"
              )}>
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect
                    ? <CheckCircle size={17} className="text-[hsl(var(--success))] shrink-0 mt-0.5" />
                    : selected.length === 0
                    ? <div className="w-[17px] h-[17px] rounded-full border-2 border-[hsl(var(--border))] shrink-0 mt-0.5" />
                    : <XCircle size={17} className="text-[hsl(var(--error))] shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="text-xs text-[hsl(var(--text-muted))] mb-1">Q{i + 1}</p>
                    <p className="text-sm font-medium text-[hsl(var(--text-primary))] leading-relaxed">{q.text}</p>
                  </div>
                </div>

                <div className="grid gap-1.5 pl-8">
                  {opts.map((opt, oi) => {
                    const isCorrectOpt = correct.includes(oi);
                    const isSelectedOpt = selected.includes(oi);
                    return (
                      <div key={oi} className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm",
                        isCorrectOpt ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] font-medium" :
                        isSelectedOpt ? "bg-[hsl(var(--error)/0.1)] text-[hsl(var(--error))]" :
                        "text-[hsl(var(--text-secondary))]"
                      )}>
                        <span className="font-semibold text-xs">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                        {isCorrectOpt && <span className="ml-auto text-xs">(correct)</span>}
                        {isSelectedOpt && !isCorrectOpt && <span className="ml-auto text-xs">(your answer)</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-3 pl-8">
                  <span className="badge-neutral">{q.topic}</span>
                  <span className={cn("text-xs font-medium",
                    (ans.marksAwarded ?? 0) > 0 ? "text-[hsl(var(--success))]" :
                    (ans.marksAwarded ?? 0) < 0 ? "text-[hsl(var(--error))]" :
                    "text-[hsl(var(--text-muted))]"
                  )}>
                    {(ans.marksAwarded ?? 0) > 0 ? "+" : ""}{ans.marksAwarded ?? 0} marks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
