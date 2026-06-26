import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/batches/[id]/members — enroll a student by email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const batch = await db.batch.findFirst({
    where: {
      id,
      trainers: { some: { id: session.user.id } },
    },
  });

  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const student = await db.user.findUnique({ where: { email, role: "STUDENT" } });
  if (!student) {
    return NextResponse.json({ error: "No student found with that email" }, { status: 404 });
  }

  await db.batchMember.upsert({
    where: { userId_batchId: { userId: student.id, batchId: batch.id } },
    create: { userId: student.id, batchId: batch.id },
    update: {},
  });

  return NextResponse.json({ message: "Student enrolled successfully" });
}

// GET /api/batches/[id]/members — list students in batch
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await db.batchMember.findMany({
    where: { batchId: id },
    include: {
      user: { select: { id: true, name: true, email: true, rollNumber: true, branch: true } },
    },
  });

  return NextResponse.json({ members: members.map((m) => m.user) });
}
