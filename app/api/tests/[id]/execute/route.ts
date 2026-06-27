import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PISTON_API_URL = "https://emacs.piston.rs/api/v2/execute";

const LANGUAGE_VERSIONS: Record<string, string> = {
  javascript: "18.15.0",
  python: "3.10.0",
  java: "15.0.2",
  "c++": "10.2.0",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: testId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { questionId, code, language } = await req.json();

  const attempt = await db.attempt.findUnique({
    where: { testId_studentId: { testId, studentId: session.user.id } },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "No active attempt" }, { status: 400 });
  }

  const question = await db.questionCoding.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const version = LANGUAGE_VERSIONS[language] || "*";
  const testCases = question.testCases as any[];
  const results = [];
  const { execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  for (const tc of testCases) {
    try {
      const tempDir = os.tmpdir();
      const isPython = language === 'python';
      const ext = isPython ? '.py' : '.js';
      const filename = path.join(tempDir, `code_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
      fs.writeFileSync(filename, code);

      let actualOutput = '';
      let passed = false;

      try {
        const cmd = isPython ? 'python' : 'node';
        actualOutput = execSync(`${cmd} ${filename}`, {
          input: tc.input || "",
          timeout: 5000,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
      } catch (execErr: any) {
        actualOutput = (execErr.stdout || "") + (execErr.stderr || "");
      }

      actualOutput = actualOutput.trim();
      passed = actualOutput === (tc.expectedOutput || "").trim();

      try {
        fs.unlinkSync(filename);
      } catch (e) {}

      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        passed,
        isHidden: tc.isHidden,
      });
    } catch (e: any) {
      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "Execution Error: " + e.message,
        passed: false,
        isHidden: tc.isHidden,
      });
    }
  }

  // We only return the details for non-hidden test cases to the student.
  // We save the full results for final submission.
  const publicResults = results.map((r) => 
    r.isHidden ? { passed: r.passed, isHidden: true } : r
  );

  const isCorrect = results.every(r => r.passed);
  await db.answerCoding.upsert({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    create: { attemptId: attempt.id, questionId, submittedCode: code, testCaseResults: results, isCorrect, savedAt: new Date() },
    update: { submittedCode: code, testCaseResults: results, isCorrect, savedAt: new Date() },
  });

  return NextResponse.json({ results: publicResults, fullResults: results });
}
