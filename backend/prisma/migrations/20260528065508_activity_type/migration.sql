/*
  Warnings:

  - You are about to drop the column `status` on the `ApplicationHistory` table. All the data in the column will be lost.
  - Added the required column `changedBy` to the `ApplicationHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toStatus` to the `ApplicationHistory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGED', 'STARRED', 'UNSTARRED', 'PRIORITY_SET', 'PRIORITY_CLEARED', 'NOTE_ADDED', 'TAG_ADDED', 'TAG_REMOVED', 'VIEWED', 'EMAILED', 'INTERVIEW_SCHEDULED', 'FEEDBACK_SUBMITTED', 'OFFER_SENT', 'OFFER_RESPONDED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "isStarred" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priority" INTEGER,
ADD COLUMN     "prioritySetAt" TIMESTAMP(3),
ADD COLUMN     "prioritySetBy" TEXT,
ADD COLUMN     "starredAt" TIMESTAMP(3),
ADD COLUMN     "starredBy" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ApplicationHistory" DROP COLUMN "status",
ADD COLUMN     "changedBy" TEXT NOT NULL,
ADD COLUMN     "changedByType" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "fromStatus" "ApplicationStatus",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "toStatus" "ApplicationStatus" NOT NULL;

-- CreateTable
CREATE TABLE "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationActivity_applicationId_idx" ON "ApplicationActivity"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationActivity_activityType_idx" ON "ApplicationActivity"("activityType");

-- CreateIndex
CREATE INDEX "ApplicationActivity_createdAt_idx" ON "ApplicationActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Application_isStarred_idx" ON "Application"("isStarred");

-- CreateIndex
CREATE INDEX "Application_priority_idx" ON "Application"("priority");

-- CreateIndex
CREATE INDEX "Application_lastActivityAt_idx" ON "Application"("lastActivityAt");

-- CreateIndex
CREATE INDEX "ApplicationHistory_toStatus_idx" ON "ApplicationHistory"("toStatus");

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
