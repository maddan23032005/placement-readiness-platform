import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.result.findUnique({
    where: { attemptId },
    include: {
      attempt: {
        include: {
          test: { select: { title: true, durationMins: true, negativeMarking: true } },
          answers: {
            include: {
              question: {
                select: {
                  id: true, text: true, options: true, correctOptions: true, topic: true,
                },
              },
            },
          },
          student: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!result) return NextResponse.json({ error: "Result not found" }, { status: 404 });

  if (
    session.user.role === "STUDENT" &&
    result.attempt.student.id !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ result });
}
