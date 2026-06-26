import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { autosaveSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = autosaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { questionId, selectedOptions } = parsed.data;

  const attempt = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: session.user.id } },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "No active attempt" }, { status: 409 });
  }

  await db.answerMCQ.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    create: { attemptId: attempt.id, questionId, selectedOptions, savedAt: new Date() },
    update: { selectedOptions, savedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
