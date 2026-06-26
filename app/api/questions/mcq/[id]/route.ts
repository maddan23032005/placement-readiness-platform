import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mcqQuestionSchema } from "@/lib/validations";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const question = await db.questionMCQ.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = mcqQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.questionMCQ.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ question: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const question = await db.questionMCQ.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Manually delete related records to prevent foreign key constraint violations
  await db.testQuestion.deleteMany({ where: { questionId: id } });
  await db.answerMCQ.deleteMany({ where: { questionId: id } });

  await db.questionMCQ.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
