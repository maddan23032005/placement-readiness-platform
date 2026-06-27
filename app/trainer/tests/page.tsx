import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { ClipboardList, Plus, BarChart2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TestStatusControl } from "./TestStatusControl";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tests" };

export default async function TrainerTestsPage() {
  const session = await auth();
  const tests = await db.test.findMany({
    where: { createdById: session!.user.id },
    include: {
      _count: { select: { questions: true, attempts: true } },
      batches: { include: { batch: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tests</h1>
          <p className="page-subtitle">Manage all your assessments</p>
        </div>
        <Link href="/trainer/tests/new">
          <Button><Plus size={15} /> Create test</Button>
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList size={36} />}
            title="No tests yet"
            description="Create your first assessment to get started."
            action={
              <Link href="/trainer/tests/new">
                <Button><Plus size={14} /> Create test</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div key={test.id} className="card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-5">
              <div className="flex items-start gap-3 w-full md:w-auto md:flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-[hsl(var(--brand))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate max-w-full">{test.title}</p>
                    <span className={`badge shrink-0 ${test.status === "PUBLISHED" ? "badge-success" : test.status === "ARCHIVED" ? "badge-neutral" : "badge-warning"}`}>
                      {test.status.charAt(0) + test.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--text-muted))]">
                    {test._count.questions} qs · {test.durationMins} min ·{" "}
                    <span className="hidden sm:inline">{test.batches.map((b) => b.batch.name).join(", ")} · </span>
                    {test._count.attempts} sub{test._count.attempts !== 1 ? "s" : ""} ·{" "}
                    {formatDate(test.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-0 border-[hsl(var(--border))] pt-3 md:pt-0 mt-2 md:mt-0">
                <Link href={`/trainer/tests/${test.id}/results`}>
                  <Button variant="outline" size="sm">
                    <BarChart2 size={14} /> Results
                  </Button>
                </Link>
                <TestStatusControl testId={test.id} currentStatus={test.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
