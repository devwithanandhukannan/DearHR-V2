-- CreateEnum
CREATE TYPE "SpotJobStatus" AS ENUM ('POSTED', 'SEARCHING', 'MATCHED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SpotBookingStatus" AS ENUM ('PENDING_RESPONSE', 'ACCEPTED', 'DECLINED', 'TIMED_OUT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'SPOT_JOB_POSTED';
ALTER TYPE "ActivityType" ADD VALUE 'SPOT_JOB_MATCHED';
ALTER TYPE "ActivityType" ADD VALUE 'SPOT_JOB_CONFIRMED';
ALTER TYPE "ActivityType" ADD VALUE 'SPOT_JOB_COMPLETED';

-- CreateTable
CREATE TABLE "SpotJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "rate" DECIMAL(10,2) NOT NULL,
    "rateType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "status" "SpotJobStatus" NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotJobBooking" (
    "id" TEXT NOT NULL,
    "spotJobId" TEXT NOT NULL,
    "jobSeekerProfileId" TEXT NOT NULL,
    "status" "SpotBookingStatus" NOT NULL DEFAULT 'PENDING_RESPONSE',
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotJobBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpotJob_companyId_idx" ON "SpotJob"("companyId");

-- CreateIndex
CREATE INDEX "SpotJob_status_idx" ON "SpotJob"("status");

-- CreateIndex
CREATE INDEX "SpotJob_startTime_idx" ON "SpotJob"("startTime");

-- CreateIndex
CREATE INDEX "SpotJobBooking_spotJobId_idx" ON "SpotJobBooking"("spotJobId");

-- CreateIndex
CREATE INDEX "SpotJobBooking_jobSeekerProfileId_idx" ON "SpotJobBooking"("jobSeekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotJobBooking_spotJobId_jobSeekerProfileId_key" ON "SpotJobBooking"("spotJobId", "jobSeekerProfileId");

-- AddForeignKey
ALTER TABLE "SpotJob" ADD CONSTRAINT "SpotJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotJobBooking" ADD CONSTRAINT "SpotJobBooking_spotJobId_fkey" FOREIGN KEY ("spotJobId") REFERENCES "SpotJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotJobBooking" ADD CONSTRAINT "SpotJobBooking_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "JobSeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
