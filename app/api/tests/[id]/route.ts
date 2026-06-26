import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const test = await db.test.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          question: {
            select: {
              id: true,
              text: true,
              options: true,
              topic: true,
              difficulty: true,
              // NEVER return correctOptions to the client
            },
          },
        },
        orderBy: { order: "asc" },
      },
      batches: { include: { batch: { select: { id: true, name: true } } } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  return NextResponse.json({ test });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const test = await db.test.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { status } = body;

  const updated = await db.test.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ test: updated });
}
