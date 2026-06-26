import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { ClipboardList, PlayCircle, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Tests" };

export default async function StudentTestsPage() {
  const session = await auth();
  const userId = session!.user.id;

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
        include: { result: { select: { totalScore: true, maxScore: true, attemptId: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tests</h1>
          <p className="page-subtitle">All tests assigned to your batch</p>
        </div>
      </div>

      {tests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList size={36} />}
            title="No tests assigned yet"
            description="Your trainer hasn't assigned any tests to your batch. Check back later."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const attempt = test.attempts[0];
            const isSubmitted = attempt?.status === "SUBMITTED";
            const isInProgress = attempt?.status === "IN_PROGRESS";
            const result = attempt?.result;
            const pct = result ? Math.round((result.totalScore / result.maxScore) * 100) : null;

            return (
              <div key={test.id} className="card p-5 flex items-center gap-5">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-[hsl(var(--brand))]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">
                      {test.title}
                    </p>
                    {isSubmitted && (
                      <span className="badge badge-success shrink-0">
                        <CheckCircle size={11} /> Submitted
                      </span>
                    )}
                    {isInProgress && (
                      <span className="badge badge-warning shrink-0">
                        <Clock size={11} /> In Progress
                      </span>
                    )}
                    {!attempt && (
                      <span className="badge badge-neutral shrink-0">Not started</span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--text-muted))]">
                    {test._count.questions} questions · {test.durationMins} min
                    {test.negativeMarking && " · Negative marking"}
                    {test.startAt && ` · Opens ${formatDate(test.startAt)}`}
                  </p>
                </div>

                {isSubmitted && pct !== null ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${pct >= 60 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--error))]"}`}>
                        {pct}%
                      </p>
                      <p className="text-xs text-[hsl(var(--text-muted))]">
                        {result!.totalScore} / {result!.maxScore}
                      </p>
                    </div>
                    <Link href={`/student/tests/${test.id}/result`}>
                      <Button variant="outline" size="sm">View result</Button>
                    </Link>
                  </div>
                ) : (
                  <Link href={`/student/tests/${test.id}/take`}>
                    <Button size="sm" variant={isInProgress ? "secondary" : "primary"}>
                      <PlayCircle size={15} />
                      {isInProgress ? "Resume" : "Start test"}
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
