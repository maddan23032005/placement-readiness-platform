import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTestSchema } from "@/lib/validations";


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let tests;
  if (session.user.role === "STUDENT") {
    // Only see published tests assigned to their batches
    const memberships = await db.batchMember.findMany({
      where: { userId: session.user.id },
      select: { batchId: true },
    });
    const batchIds = memberships.map((m) => m.batchId);

    tests = await db.test.findMany({
      where: {
        status: "PUBLISHED",
        batches: { some: { batchId: { in: batchIds } } },
      },
      include: {
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: session.user.id },
          select: { id: true, status: true, submittedAt: true },
        },
      },
      orderBy: { startAt: "asc" },
    });
  } else {
    // Trainer sees own tests
    tests = await db.test.findMany({
      where: { createdById: session.user.id },
      include: {
        _count: { select: { questions: true, attempts: true } },
        batches: { include: { batch: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, durationMins, startAt, endAt, negativeMarking, negativeValue, batchIds, questions } = parsed.data;

  const test = await db.test.create({
    data: {
      title,
      description,
      durationMins,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      negativeMarking,
      negativeValue,
      createdById: session.user.id,
      questions: {
        create: questions.map((q) => ({
          questionId: q.questionId,
          questionCodingId: q.questionCodingId,
          marks: q.marks,
          order: q.order,
        })),
      },
      batches: {
        create: batchIds.map((batchId) => ({ batchId })),
      },
    },
    include: {
      questions: { include: { question: true } },
      batches: { include: { batch: true } },
    },
  });

  return NextResponse.json({ test }, { status: 201 });
}
