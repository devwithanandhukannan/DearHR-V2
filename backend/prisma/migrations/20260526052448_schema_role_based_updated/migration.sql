/*
  Warnings:

  - You are about to drop the column `email` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `mobileNumber` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `requestedBy` on the `RescheduleRequest` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,userId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedByUserId` to the `RescheduleRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `TeamMember` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Company_email_idx";

-- DropIndex
DROP INDEX "Company_email_key";

-- DropIndex
DROP INDEX "TeamMember_userId_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "email",
DROP COLUMN "isEmailVerified",
DROP COLUMN "mobileNumber",
DROP COLUMN "passwordHash";

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RescheduleRequest" DROP COLUMN "requestedBy",
ADD COLUMN     "requestedByRole" INTEGER,
ADD COLUMN     "requestedByUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "role",
ADD COLUMN     "roles" INTEGER NOT NULL DEFAULT 16,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "globalRoles" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "username" TEXT NOT NULL;

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE INDEX "Achievement_jobSeekerProfileId_idx" ON "Achievement"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Application_jobSeekerProfileId_idx" ON "Application"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Application_jobPostingId_idx" ON "Application"("jobPostingId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Certification_jobSeekerProfileId_idx" ON "Certification"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Education_jobSeekerProfileId_idx" ON "Education"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Experience_jobSeekerProfileId_idx" ON "Experience"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Interview_applicationId_idx" ON "Interview"("applicationId");

-- CreateIndex
CREATE INDEX "Interview_scheduledTime_idx" ON "Interview"("scheduledTime");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "InterviewBatch_companyId_idx" ON "InterviewBatch"("companyId");

-- CreateIndex
CREATE INDEX "InterviewBatch_startTime_idx" ON "InterviewBatch"("startTime");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewId_idx" ON "InterviewFeedback"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewerId_idx" ON "InterviewFeedback"("interviewerId");

-- CreateIndex
CREATE INDEX "JobPosting_createdAt_idx" ON "JobPosting"("createdAt");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_email_idx" ON "JobSeekerProfile"("email");

-- CreateIndex
CREATE INDEX "JobSeekerProfile_userId_idx" ON "JobSeekerProfile"("userId");

-- CreateIndex
CREATE INDEX "Language_jobSeekerProfileId_idx" ON "Language"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "OfferLetter_applicationId_idx" ON "OfferLetter"("applicationId");

-- CreateIndex
CREATE INDEX "OfferLetter_status_idx" ON "OfferLetter"("status");

-- CreateIndex
CREATE INDEX "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- CreateIndex
CREATE INDEX "Project_jobSeekerProfileId_idx" ON "Project"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "RescheduleRequest_interviewId_idx" ON "RescheduleRequest"("interviewId");

-- CreateIndex
CREATE INDEX "RescheduleRequest_requestedByUserId_idx" ON "RescheduleRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "Resume_jobSeekerProfileId_idx" ON "Resume"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "Skill_jobSeekerProfileId_idx" ON "Skill"("jobSeekerProfileId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_companyId_idx" ON "TeamMember"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_companyId_userId_key" ON "TeamMember"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_mobileNumber_idx" ON "User"("mobileNumber");
