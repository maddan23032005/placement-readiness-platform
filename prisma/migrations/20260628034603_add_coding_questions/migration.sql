-- DropForeignKey
ALTER TABLE "TestQuestion" DROP CONSTRAINT "TestQuestion_questionId_fkey";

-- AlterTable
ALTER TABLE "TestQuestion" ADD COLUMN     "questionCodingId" TEXT,
ALTER COLUMN "questionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "QuestionCoding" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'javascript',
    "starterCode" TEXT NOT NULL,
    "testCases" JSONB NOT NULL,
    "solutionCode" TEXT,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionCoding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerCoding" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "submittedCode" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "marksAwarded" DOUBLE PRECISION,
    "testCaseResults" JSONB,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerCoding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerCoding_attemptId_questionId_key" ON "AnswerCoding"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionMCQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_questionCodingId_fkey" FOREIGN KEY ("questionCodingId") REFERENCES "QuestionCoding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionCoding" ADD CONSTRAINT "QuestionCoding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerCoding" ADD CONSTRAINT "AnswerCoding_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerCoding" ADD CONSTRAINT "AnswerCoding_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionCoding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
