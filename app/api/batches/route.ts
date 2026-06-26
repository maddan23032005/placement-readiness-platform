import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { batchSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let batches;
  if (session.user.role === "TRAINER") {
    batches = await db.batch.findMany({
      where: { trainers: { some: { id: session.user.id } } },
      include: { _count: { select: { members: true } }, trainers: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  } else if (session.user.role === "STUDENT") {
    batches = await db.batch.findMany({
      where: { members: { some: { userId: session.user.id } } },
      include: { _count: { select: { members: true } } },
    });
  } else {
    batches = await db.batch.findMany({
      include: { _count: { select: { members: true } }, trainers: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json({ batches });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const batch = await db.batch.create({
    data: {
      name: parsed.data.name,
      trainers: { connect: { id: session.user.id } },
    },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json({ batch }, { status: 201 });
}
