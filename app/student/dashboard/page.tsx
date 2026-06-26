import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/Card";
import { ClipboardList, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatRelative, formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  // Get assigned tests
  const memberships = await db.batchMember.findMany({
    where: { userId },
    select: { batchId: true },
  });
  const batchIds = memberships.map((m) => m.batchId);

  const tests = await db.test.findMany({
    where: { status: "PUBLISHED", batches: { some: { batchId: { in: batchIds } } } },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { studentId: userId },
        include: { result: { select: { totalScore: true, maxScore: true } } },
      },
    },
    orderBy: { startAt: "asc" },
  });

  const upcoming = tests.filter((t) => !t.attempts.length || t.attempts[0].status === "IN_PROGRESS");
  const completed = tests.filter((t) => t.attempts.length && t.attempts[0].status === "SUBMITTED");

  const totalTests = completed.length;
  const avgPct = totalTests > 0
    ? Math.round(
        completed.reduce((s, t) => {
          const r = t.attempts[0]?.result;
          return s + (r ? (r.totalScore / r.maxScore) * 100 : 0);
        }, 0) / totalTests
      )
    : null;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {session!.user.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <span className="stat-label">Tests Assigned</span>
          <span className="stat-value">{tests.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{totalTests}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. Score</span>
          <span className="stat-value">{avgPct !== null ? `${avgPct}%` : "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming tests */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tests</CardTitle>
            <Link href="/student/tests" className="text-xs text-[hsl(var(--brand))] hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={32} />}
              title="No upcoming tests"
              description="Tests assigned to your batch will appear here."
            />
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/student/tests/${t.id}/take`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--surface-2))] transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                      <ClipboardList size={17} className="text-[hsl(var(--brand))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{t.title}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))]">
                        {t._count.questions} questions · {t.durationMins} min
                      </p>
                    </div>
                    <div className="text-xs font-medium text-[hsl(var(--info))] shrink-0 flex items-center gap-1">
                      <Clock size={12} />
                      {t.startAt ? formatRelative(t.startAt) : "Open"}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          {completed.length === 0 ? (
            <EmptyState
              icon={<CheckCircle size={32} />}
              title="No completed tests yet"
              description="Submit a test to see your results here."
            />
          ) : (
            <ul className="space-y-3">
              {completed.slice(0, 4).map((t) => {
                const r = t.attempts[0]?.result;
                const pct = r ? Math.round((r.totalScore / r.maxScore) * 100) : 0;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/student/tests/${t.id}/result`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--surface-2))] transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${pct >= 60 ? "bg-[hsl(var(--success)/0.12)]" : "bg-[hsl(var(--error)/0.1)]"}`}>
                        {pct >= 60
                          ? <CheckCircle size={17} className="text-[hsl(var(--success))]" />
                          : <AlertCircle size={17} className="text-[hsl(var(--error))]" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{t.title}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))]">{formatDate(t.attempts[0].submittedAt!)}</p>
                      </div>
                      <span className={`text-sm font-bold ${pct >= 60 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--error))]"}`}>
                        {pct}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
