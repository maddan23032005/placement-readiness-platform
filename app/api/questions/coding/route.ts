import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { codingQuestionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");

  const questions = await db.questionCoding.findMany({
    where: {
      createdById: session.user.id,
      ...(topic && { topic }),
      ...(difficulty && { difficulty: difficulty as "EASY" | "MEDIUM" | "HARD" }),
      ...(search && { title: { contains: search, mode: "insensitive" } }),
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "TRAINER" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = codingQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, language, starterCode, testCases, solutionCode, topic, difficulty, tags } = parsed.data;

  const question = await db.questionCoding.create({
    data: {
      title,
      description,
      language,
      starterCode,
      testCases,
      solutionCode,
      topic,
      difficulty,
      tags,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
