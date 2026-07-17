-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "experienceRequired" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "locationType" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "salaryRange" TEXT;

-- CreateIndex
CREATE INDEX "JobPosting_companyId_idx" ON "JobPosting"("companyId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");
