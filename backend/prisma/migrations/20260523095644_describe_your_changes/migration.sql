/*
  Warnings:

  - You are about to drop the column `userId` on the `Achievement` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Education` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `expectedSalary` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `experienceLevel` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `jobType` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredIndustries` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredRoles` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profilePic` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `workLocationPreference` on the `JobSeekerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Language` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `atsBreakdown` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `autoCorrectedText` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `htmlContent` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `improvements` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `keywordGaps` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `missingSections` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `originalFilePath` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `parsedData` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `rawText` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `strengths` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `JobSeekerProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jobSeekerProfileId` to the `Achievement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Certification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Education` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `JobSeekerProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `JobSeekerProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Language` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purpose` to the `Otp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Resume` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Resume` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerProfileId` to the `Skill` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('active', 'closed', 'paused');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'reviewed', 'shortlisted', 'interview', 'offer', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('shortlist', 'reject', 'on_hold', 'next_round');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('sent', 'accepted', 'declined', 'negotiation');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'not_available', 'spot_available');

-- DropForeignKey
ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_userId_fkey";

-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Education" DROP CONSTRAINT "Education_userId_fkey";

-- DropForeignKey
ALTER TABLE "Experience" DROP CONSTRAINT "Experience_userId_fkey";

-- DropForeignKey
ALTER TABLE "Language" DROP CONSTRAINT "Language_userId_fkey";

-- DropForeignKey
ALTER TABLE "Otp" DROP CONSTRAINT "Otp_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resume" DROP CONSTRAINT "Resume_userId_fkey";

-- DropForeignKey
ALTER TABLE "Skill" DROP CONSTRAINT "Skill_userId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Education" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "JobSeekerProfile" DROP COLUMN "expectedSalary",
DROP COLUMN "experienceLevel",
DROP COLUMN "jobType",
DROP COLUMN "preferredIndustries",
DROP COLUMN "preferredRoles",
DROP COLUMN "profilePic",
DROP COLUMN "workLocationPreference",
ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'available',
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "jobPreferences" JSONB,
ADD COLUMN     "profilePhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "Language" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "purpose" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "atsBreakdown",
DROP COLUMN "autoCorrectedText",
DROP COLUMN "htmlContent",
DROP COLUMN "improvements",
DROP COLUMN "keywordGaps",
DROP COLUMN "missingSections",
DROP COLUMN "originalFilePath",
DROP COLUMN "parsedData",
DROP COLUMN "rawText",
DROP COLUMN "strengths",
DROP COLUMN "type",
DROP COLUMN "userId",
ADD COLUMN     "aiSuggestions" JSONB,
ADD COLUMN     "content" JSONB,
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "userId",
ADD COLUMN     "jobSeekerProfileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "fullName";

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "logoUrl" TEXT,
    "registrationNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationBadge" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "requiredSkills" JSONB NOT NULL,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "livekitRoomName" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "recordingPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "technicalRating" INTEGER NOT NULL,
    "communicationRating" INTEGER NOT NULL,
    "problemSolvingRating" INTEGER NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLetter" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE INDEX "Company_email_idx" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobSeekerProfile_email_key" ON "JobSeekerProfile"("email");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
