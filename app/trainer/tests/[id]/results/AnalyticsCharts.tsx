"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ScoreBucket { label: string; count: number; }
interface QuestionStat {
  questionId: string; text: string; topic: string;
  total: number; correct: number; correctRate: number;
}

export function AnalyticsCharts({
  scoreBuckets,
  questionStats,
}: {
  scoreBuckets: ScoreBucket[];
  questionStats: QuestionStat[];
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Score distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scoreBuckets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(220 13% 91%)" }}
              cursor={{ fill: "hsl(221 83% 95%)" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Students">
              {scoreBuckets.map((b, i) => (
                <Cell
                  key={i}
                  fill={
                    i >= 7 ? "hsl(142 71% 45%)" :
                    i >= 4 ? "hsl(221 83% 53%)" :
                    "hsl(0 72% 51%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Per-question correctness */}
      <Card>
        <CardHeader>
          <CardTitle>Question Difficulty</CardTitle>
          <span className="text-xs text-[hsl(var(--text-muted))]">% who got it right</span>
        </CardHeader>
        <div className="space-y-3 max-h-56 overflow-y-auto">
          {questionStats.map((q, i) => (
            <div key={q.questionId}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[hsl(var(--text-secondary))] truncate flex-1 pr-2">Q{i + 1}: {q.text}</span>
                <span className={cn("font-medium shrink-0",
                  q.correctRate >= 70 ? "text-[hsl(var(--success))]" :
                  q.correctRate >= 40 ? "text-[hsl(var(--warning))]" :
                  "text-[hsl(var(--error))]"
                )}>{q.correctRate}%</span>
              </div>
              <div className="h-1.5 bg-[hsl(var(--surface-2))] rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full",
                    q.correctRate >= 70 ? "bg-[hsl(var(--success))]" :
                    q.correctRate >= 40 ? "bg-[hsl(var(--warning))]" :
                    "bg-[hsl(var(--error))]"
                  )}
                  style={{ width: `${q.correctRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
