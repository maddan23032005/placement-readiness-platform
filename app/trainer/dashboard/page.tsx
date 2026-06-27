import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/Card";
import { ClipboardList, BookOpen, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TrainerBatchChart, TrainerQuestionChart } from "@/components/charts/TrainerCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trainer Dashboard" };

export default async function TrainerDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [tests, questions, batches, topicGroups, allResults] = await Promise.all([
    db.test.findMany({
      where: { createdById: userId },
      include: { _count: { select: { attempts: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.questionMCQ.count({ where: { createdById: userId } }),
    db.batch.findMany({
      where: { trainers: { some: { id: userId } } },
      include: { _count: { select: { members: true } } },
    }),
    db.questionMCQ.groupBy({
      by: ['topic'],
      where: { createdById: userId },
      _count: { id: true }
    }),
    db.result.findMany({
      where: { attempt: { test: { createdById: userId } } },
      include: { attempt: { include: { student: { include: { batchMemberships: true } } } } }
    })
  ]);

  const publishedTests = tests.filter((t) => t.status === "PUBLISHED").length;
  const totalStudents = batches.reduce((s, b) => s + b._count.members, 0);

  // Aggregate Data for Question Distribution Doughnut Chart
  const questionChartData = topicGroups.map(t => ({
    name: t.topic,
    value: t._count.id
  })).sort((a, b) => b.value - a.value);

  // Aggregate Data for Batch Performance Bar Chart
  const batchScores: Record<string, { totalPct: number; count: number }> = {};
  batches.forEach(b => { batchScores[b.id] = { totalPct: 0, count: 0 }; });

  allResults.forEach(r => {
    const pct = (r.totalScore / r.maxScore) * 100;
    r.attempt.student.batchMemberships.forEach(m => {
      if (batchScores[m.batchId]) {
        batchScores[m.batchId].totalPct += pct;
        batchScores[m.batchId].count += 1;
      }
    });
  });

  const batchChartData = batches.map(b => ({
    name: b.name,
    score: batchScores[b.id].count > 0 ? Math.round(batchScores[b.id].totalPct / batchScores[b.id].count) : 0
  }));

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[hsl(var(--brand-dark))] to-[hsl(var(--brand))] text-white p-8 md:p-10 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {session!.user.name}!</h1>
            <p className="text-white/80 max-w-xl text-sm md:text-base">
              You are currently managing {batches.length} batches and {publishedTests} active tests. Keep up the great work in preparing students for their placements.
            </p>
          </div>
          <Link href="/trainer/tests/new" className="shrink-0">
            <Button className="bg-white text-[hsl(var(--brand-dark))] hover:bg-white/90 shadow-xl border-0">
              <Plus size={16} />
              Create New Test
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <Card delay={0.1} padding={false} className="overflow-hidden group">
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Total Tests</p>
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
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Published</p>
              <h3 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{publishedTests}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card delay={0.3} padding={false} className="overflow-hidden group">
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Questions</p>
              <h3 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{questions}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card delay={0.4} padding={false} className="overflow-hidden group">
          <div className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">Total Students</p>
              <h3 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{totalStudents}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card delay={0.4} className="flex flex-col">
          <CardHeader>
            <CardTitle>Batch Performance</CardTitle>
          </CardHeader>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <TrainerBatchChart data={batchChartData} />
          </div>
        </Card>
        
        <Card delay={0.5} className="flex flex-col">
          <CardHeader>
            <CardTitle>Question Bank Topics</CardTitle>
          </CardHeader>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <TrainerQuestionChart data={questionChartData} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tests */}
        <Card delay={0.6}>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
            <Link href="/trainer/tests" className="text-xs text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-dark))] transition-colors font-semibold flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          {tests.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={32} />}
              title="No tests yet"
              description="Create your first test to get started."
              action={
                <Link href="/trainer/tests/new">
                  <Button size="sm">Create test</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {tests.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/trainer/tests/${t.id}/results`}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--brand))/0.3] hover:bg-[hsl(var(--brand-light))/0.3] transition-all duration-300 shadow-sm hover:shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-[hsl(var(--brand))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate group-hover:text-[hsl(var(--brand))] transition-colors">{t.title}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{t._count.attempts} attempt{t._count.attempts !== 1 ? "s" : ""}</p>
                    </div>
                    <span className={`badge ${t.status === "PUBLISHED" ? "badge-success" : t.status === "ARCHIVED" ? "badge-neutral" : "badge-warning"}`}>
                      {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Batches */}
        <Card delay={0.7}>
          <CardHeader>
            <CardTitle>My Batches</CardTitle>
            <Link href="/trainer/batches" className="text-xs text-[hsl(var(--brand))] hover:text-[hsl(var(--brand-dark))] transition-colors font-semibold flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </CardHeader>
          {batches.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No batches yet"
              description="Create a batch and enroll students."
              action={
                <Link href="/trainer/batches">
                  <Button size="sm">Create batch</Button>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {batches.map((b) => (
                <li key={b.id}>
                  <Link
                    href="/trainer/batches"
                    className="group flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--brand))/0.3] hover:bg-[hsl(var(--brand-light))/0.3] transition-all duration-300 shadow-sm hover:shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--surface-2))] group-hover:bg-[hsl(var(--brand-light))] transition-colors flex items-center justify-center shrink-0">
                      <Users size={18} className="text-[hsl(var(--text-secondary))] group-hover:text-[hsl(var(--brand))] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate group-hover:text-[hsl(var(--brand))] transition-colors">{b.name}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                        {b._count.members} enrolled student{b._count.members !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-[hsl(var(--text-muted))] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
