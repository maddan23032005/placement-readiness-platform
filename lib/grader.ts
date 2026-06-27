import { db } from "@/lib/db";

interface GradedAnswer {
  questionId: string;
  isCorrect: boolean;
  marksAwarded: number;
}

interface TopicStats {
  correct: number;
  total: number;
  score: number;
  maxScore: number;
}

interface GradeInput {
  id: string;
  startedAt: Date;
  answers: Array<{
    questionId: string;
    selectedOptions: unknown;
  }>;
  answersCoding?: Array<{
    questionId: string;
    isCorrect: boolean | null;
  }>;
}

interface TestQuestion {
  questionId: string | null;
  questionCodingId: string | null;
  marks: number;
  question?: {
    correctOptions: unknown;
    topic: string;
  } | null;
  questionCoding?: {
    topic: string;
  } | null;
}

interface TestConfig {
  negativeMarking: boolean;
  negativeValue: number;
}

export function gradeAttempt(
  attempt: GradeInput,
  testQuestions: TestQuestion[],
  testConfig: TestConfig,
  providedTimeSecs: number,
) {
  const questionMap = new Map<string, { marks: number; correctOptions: number[]; topic: string }>();

  for (const tq of testQuestions) {
    if (tq.question) {
      questionMap.set(tq.questionId!, {
        marks: tq.marks,
        correctOptions: tq.question.correctOptions as number[],
        topic: tq.question.topic,
      });
    } else if (tq.questionCoding) {
      questionMap.set(tq.questionCodingId!, {
        marks: tq.marks,
        correctOptions: [],
        topic: tq.questionCoding.topic,
      });
    }
  }

  let totalScore = 0;
  let maxScore = 0;
  const topicBreakdown: Record<string, TopicStats> = {};
  const gradedAnswers: GradedAnswer[] = [];

  for (const tq of testQuestions) {
    const qId = tq.questionId || tq.questionCodingId!;
    const qData = questionMap.get(qId)!;
    const topic = qData.topic;

    if (!topicBreakdown[topic]) {
      topicBreakdown[topic] = { correct: 0, total: 0, score: 0, maxScore: 0 };
    }
    topicBreakdown[topic].total += 1;
    topicBreakdown[topic].maxScore += qData.marks;
    maxScore += qData.marks;

    const tqIsCoding = !!tq.questionCoding;
    let isCorrect = false;
    let marksAwarded = 0;
    let answered = false;

    if (!tqIsCoding) {
      const answer = attempt.answers.find((a) => a.questionId === qId);
      const selected = (answer?.selectedOptions ?? []) as number[];
      const correct = qData.correctOptions;

      isCorrect =
        selected.length === correct.length &&
        correct.every((c) => selected.includes(c)) &&
        selected.every((s) => correct.includes(s));

      if (selected.length > 0) {
        answered = true;
        if (isCorrect) {
          marksAwarded = qData.marks;
        } else if (testConfig.negativeMarking) {
          marksAwarded = -(qData.marks * testConfig.negativeValue);
        }
      }
    } else {
      const answer = attempt.answersCoding?.find((a) => a.questionId === qId);
      if (answer && answer.isCorrect !== null) {
        answered = true;
        isCorrect = answer.isCorrect;
        if (isCorrect) {
          marksAwarded = qData.marks;
        } else if (testConfig.negativeMarking) {
          marksAwarded = -(qData.marks * testConfig.negativeValue);
        }
      }
    }

    if (answered) {
      totalScore += marksAwarded;
      if (isCorrect) {
        topicBreakdown[topic].correct += 1;
      }
      topicBreakdown[topic].score += marksAwarded;
    }

    gradedAnswers.push({ questionId: qId, isCorrect, marksAwarded });
  }

  // Clamp score to 0
  totalScore = Math.max(0, Math.round(totalScore * 100) / 100);

  return {
    totalScore,
    maxScore,
    topicBreakdown,
    gradedAnswers,
    timeTakenSecs: providedTimeSecs,
  };
}

export async function computePercentile(
  attemptId: string,
  testId: string,
  totalScore: number
): Promise<number> {
  const allResults = await db.result.findMany({
    where: { attempt: { testId, status: "SUBMITTED" } },
    select: { totalScore: true },
  });

  if (allResults.length === 0) return 100;

  const scores = allResults.map((r) => r.totalScore);
  const below = scores.filter((s) => s < totalScore).length;
  return Math.round((below / scores.length) * 100);
}
