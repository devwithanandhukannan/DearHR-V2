/*
  Warnings:

  - You are about to drop the column `interviewerIds` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `interviewerIds` on the `InterviewBatch` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_batchId_fkey";

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "interviewerIds";

-- AlterTable
ALTER TABLE "InterviewBatch" DROP COLUMN "interviewerIds";

-- CreateTable
CREATE TABLE "InterviewBatchInterviewer" (
    "id" TEXT NOT NULL,
    "interviewBatchId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "InterviewBatchInterviewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewInterviewer" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,

    CONSTRAINT "InterviewInterviewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewBatchInterviewer_teamMemberId_idx" ON "InterviewBatchInterviewer"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewBatchInterviewer_interviewBatchId_teamMemberId_key" ON "InterviewBatchInterviewer"("interviewBatchId", "teamMemberId");

-- CreateIndex
CREATE INDEX "InterviewInterviewer_teamMemberId_idx" ON "InterviewInterviewer"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewInterviewer_interviewId_teamMemberId_key" ON "InterviewInterviewer"("interviewId", "teamMemberId");

-- AddForeignKey
ALTER TABLE "InterviewBatchInterviewer" ADD CONSTRAINT "InterviewBatchInterviewer_interviewBatchId_fkey" FOREIGN KEY ("interviewBatchId") REFERENCES "InterviewBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBatchInterviewer" ADD CONSTRAINT "InterviewBatchInterviewer_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInterviewer" ADD CONSTRAINT "InterviewInterviewer_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewInterviewer" ADD CONSTRAINT "InterviewInterviewer_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InterviewBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
