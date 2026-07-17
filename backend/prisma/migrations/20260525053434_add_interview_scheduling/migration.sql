/*
  Warnings:

  - A unique constraint covering the columns `[livekitRoomName]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joinLink` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('video', 'coding_test', 'mixed');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "format" "InterviewFormat" NOT NULL DEFAULT 'video',
ADD COLUMN     "interviewerIds" TEXT[],
ADD COLUMN     "joinLink" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InterviewBatch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobPostingId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "slotDuration" INTEGER NOT NULL,
    "interviewFormat" "InterviewFormat" NOT NULL,
    "interviewerIds" TEXT[],
    "selectedCandidateIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_livekitRoomName_key" ON "Interview"("livekitRoomName");

-- AddForeignKey
ALTER TABLE "InterviewBatch" ADD CONSTRAINT "InterviewBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewBatch" ADD CONSTRAINT "InterviewBatch_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InterviewBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
