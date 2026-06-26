import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/Card";
import { ClipboardList, BookOpen, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trainer Dashboard" };

export default async function TrainerDashboard() {
  const session = await auth();
  const userId = session!.user.id;

  const [tests, questions, batches] = await Promise.all([
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
  ]);

  const publishedTests = tests.filter((t) => t.status === "PUBLISHED").length;
  const totalStudents = batches.reduce((s, b) => s + b._count.members, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {session!.user.name}</p>
        </div>
        <Link href="/trainer/tests/new">
          <Button>
            <ClipboardList size={15} />
            Create test
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <span className="stat-label">Total Tests</span>
          <span className="stat-value">{tests.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Published</span>
          <span className="stat-value">{publishedTests}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Questions</span>
          <span className="stat-value">{questions}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Students</span>
          <span className="stat-value">{totalStudents}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent tests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
            <Link href="/trainer/tests" className="text-xs text-[hsl(var(--brand))] hover:underline font-medium">
              View all
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
            <ul className="space-y-2">
              {tests.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/trainer/tests/${t.id}/results`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--surface-2))] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                      <ClipboardList size={15} className="text-[hsl(var(--brand))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{t.title}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))]">{t._count.attempts} attempt{t._count.attempts !== 1 ? "s" : ""}</p>
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
        <Card>
          <CardHeader>
            <CardTitle>My Batches</CardTitle>
            <Link href="/trainer/batches" className="text-xs text-[hsl(var(--brand))] hover:underline font-medium">
              Manage
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
            <ul className="space-y-2">
              {batches.map((b) => (
                <li key={b.id}>
                  <Link
                    href="/trainer/batches"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--surface-2))] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--surface-2))] flex items-center justify-center shrink-0">
                      <Users size={15} className="text-[hsl(var(--text-secondary))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{b.name}</p>
                    </div>
                    <span className="text-xs text-[hsl(var(--text-muted))]">
                      {b._count.members} student{b._count.members !== 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
