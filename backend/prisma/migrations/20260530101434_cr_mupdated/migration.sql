/*
  Warnings:

  - You are about to drop the column `internalNotes` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `isStarred` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `prioritySetAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `prioritySetBy` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `starredAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `starredBy` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Application` table. All the data in the column will be lost.
  - You are about to alter the column `salary` on the `OfferLetter` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[jobSeekerProfileId,name]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CandidatePriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('LINKEDIN', 'GITHUB', 'REFERRAL', 'CAREERS_PAGE', 'JOB_PORTAL', 'MANUAL');

-- CreateEnum
CREATE TYPE "CandidateCrmStatus" AS ENUM ('ACTIVE', 'NURTURING', 'FUTURE_OPPORTUNITY', 'DO_NOT_CONTACT', 'HIRED_ELSEWHERE');

-- DropIndex
DROP INDEX "Application_isStarred_idx";

-- DropIndex
DROP INDEX "Application_priority_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "internalNotes",
DROP COLUMN "isStarred",
DROP COLUMN "priority",
DROP COLUMN "prioritySetAt",
DROP COLUMN "prioritySetBy",
DROP COLUMN "starredAt",
DROP COLUMN "starredBy",
DROP COLUMN "tags";

-- AlterTable
ALTER TABLE "OfferLetter" ALTER COLUMN "salary" SET DATA TYPE DECIMAL(12,2);

-- DropEnum
DROP TYPE "OfferStatus";

-- CreateTable
CREATE TABLE "CompanyCandidateProfile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "ownerId" TEXT,
    "source" "CandidateSource",
    "sourceUrl" TEXT,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "crmPriority" "CandidatePriority",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "crmNotes" TEXT,
    "status" "CandidateCrmStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentPoolMember" (
    "id" TEXT NOT NULL,
    "talentPoolId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentPoolMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmInteractionLog" (
    "id" TEXT NOT NULL,
    "companyCandidateProfileId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmInteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_companyId_idx" ON "CompanyCandidateProfile"("companyId");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_jobSeekerProfileId_idx" ON "CompanyCandidateProfile"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_ownerId_idx" ON "CompanyCandidateProfile"("ownerId");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_status_idx" ON "CompanyCandidateProfile"("status");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_isStarred_idx" ON "CompanyCandidateProfile"("isStarred");

-- CreateIndex
CREATE INDEX "CompanyCandidateProfile_crmPriority_idx" ON "CompanyCandidateProfile"("crmPriority");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCandidateProfile_companyId_jobSeekerProfileId_key" ON "CompanyCandidateProfile"("companyId", "jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "TalentPool_companyId_idx" ON "TalentPool"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPool_companyId_name_key" ON "TalentPool"("companyId", "name");

-- CreateIndex
CREATE INDEX "TalentPoolMember_talentPoolId_idx" ON "TalentPoolMember"("talentPoolId");

-- CreateIndex
CREATE INDEX "TalentPoolMember_jobSeekerProfileId_idx" ON "TalentPoolMember"("jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentPoolMember_talentPoolId_jobSeekerProfileId_key" ON "TalentPoolMember"("talentPoolId", "jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "CrmInteractionLog_companyCandidateProfileId_idx" ON "CrmInteractionLog"("companyCandidateProfileId");

-- CreateIndex
CREATE INDEX "CrmInteractionLog_createdAt_idx" ON "CrmInteractionLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_jobSeekerProfileId_name_key" ON "Skill"("jobSeekerProfileId", "name");

-- AddForeignKey
ALTER TABLE "CompanyCandidateProfile" ADD CONSTRAINT "CompanyCandidateProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCandidateProfile" ADD CONSTRAINT "CompanyCandidateProfile_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCandidateProfile" ADD CONSTRAINT "CompanyCandidateProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPool" ADD CONSTRAINT "TalentPool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPoolMember" ADD CONSTRAINT "TalentPoolMember_talentPoolId_fkey" FOREIGN KEY ("talentPoolId") REFERENCES "TalentPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentPoolMember" ADD CONSTRAINT "TalentPoolMember_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmInteractionLog" ADD CONSTRAINT "CrmInteractionLog_companyCandidateProfileId_fkey" FOREIGN KEY ("companyCandidateProfileId") REFERENCES "CompanyCandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
