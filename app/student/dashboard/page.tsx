import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/Card";
import { ClipboardList, Clock, CheckCircle, AlertCircle, ArrowRight, PlayCircle, Trophy } from "lucide-react";
import Link from "next/link";
import { formatRelative, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { StudentRadarChart, StudentTrendChart } from "@/components/charts/StudentCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Student Dashboard" };

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
        include: { result: { select: { totalScore: true, maxScore: true, topicBreakdown: true, generatedAt: true } } },
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

  // Aggregate Data for Radar Chart (Topic Performance)
  const topicStats: Record<string, { score: number; maxScore: number }> = {};
  completed.forEach(t => {
    const breakdown = t.attempts[0]?.result?.topicBreakdown as Record<string, { score: number; maxScore: number }> | null;
    if (breakdown) {
      Object.entries(breakdown).forEach(([topic, stats]) => {
        if (!topicStats[topic]) topicStats[topic] = { score: 0, maxScore: 0 };
        topicStats[topic].score += stats.score;
        topicStats[topic].maxScore += stats.maxScore;
      });
    }
  });

  const radarData = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    score: stats.maxScore > 0 ? Math.round((stats.score / stats.maxScore) * 100) : 0,
    fullMark: 100
  }));

  // Aggregate Data for Trend Chart
  const trendData = [...completed]
    .sort((a, b) => new Date(a.attempts[0]!.result?.generatedAt || 0).getTime() - new Date(b.attempts[0]!.result?.generatedAt || 0).getTime())
    .map(t => {
      const r = t.attempts[0]?.result;
      return {
        name: t.title,
        score: r ? Math.round((r.totalScore / r.maxScore) * 100) : 0
      };
    });

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[hsl(var(--brand-dark))] to-[hsl(var(--brand))] text-white p-8 md:p-10 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {session!.user.name}!</h1>
            <p className="text-white/80 max-w-xl text-sm md:text-base">
              You have {upcoming.length} upcoming {upcoming.length === 1 ? "test" : "tests"} to complete. Keep pushing forward on your placement journey.
            </p>
          </div>
          <Link href="/student/tests" className="shrink-0">
            <Button className="bg-white text-[hsl(var(--brand-dark))] hover:bg-white/90 shadow-xl border-0">
              View All Tests
              <ArrowRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Card delay={0.1} padding={false} className="overflow-hidden group">
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Tests Assigned</p>
              <h3 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{tests.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--brand-light))] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ClipboardList size={18} className="text-[hsl(var(--brand))]" />
            </div>
          </div>
        </Card>
        
        <Card delay={0.2} padding={false} className="overflow-hidden group">
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Completed</p>
              <h3 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{totalTests}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card delay={0.3} padding={false} className="overflow-hidden group col-span-2 md:col-span-1">
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Avg. Score</p>
              <h3 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{avgPct !== null ? `${avgPct}%` : "—"}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Trophy size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card delay={0.4} className="flex flex-col">
          <CardHeader>
            <CardTitle>Skill Mastery</CardTitle>
          </CardHeader>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <StudentRadarChart data={radarData} />
          </div>
        </Card>
        
        <Card delay={0.5} className="flex flex-col">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <StudentTrendChart data={trendData} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming tests */}
        <Card delay={0.6}>
          <CardHeader>
            <CardTitle>Upcoming Tests</CardTitle>
            <Link href="/student/tests" className="text-xs text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-dark))] transition-colors font-semibold flex items-center gap-1">
              View all <ArrowRight size={12} />
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
                    className="group flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--brand))/0.3] hover:bg-[hsl(var(--brand-light))/0.3] transition-all duration-300 shadow-sm hover:shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                      <PlayCircle size={18} className="text-[hsl(var(--brand))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate group-hover:text-[hsl(var(--brand))] transition-colors">{t.title}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                        {t._count.questions} questions · {t.durationMins} min
                      </p>
                    </div>
                    <div className="text-xs font-bold bg-[hsl(var(--surface-2))] group-hover:bg-white dark:group-hover:bg-[hsl(var(--surface))] px-2.5 py-1 rounded-md text-[hsl(var(--info))] shrink-0 flex items-center gap-1.5 transition-colors">
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
        <Card delay={0.7}>
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
                      className="group flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--border-focus))/0.3] hover:bg-[hsl(var(--surface-2))] transition-all duration-300 shadow-sm hover:shadow"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pct >= 60 ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-red-100 dark:bg-red-500/20"}`}>
                        {pct >= 60
                          ? <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                          : <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">{t.title}</p>
                        <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{formatDate(t.attempts[0].submittedAt!)}</p>
                      </div>
                      <span className={`text-sm font-bold ${pct >= 60 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
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
    </div>
  );
}
