/*
  Warnings:

  - The `status` column on the `OfferLetter` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `currency` to the `OfferLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employmentType` to the `OfferLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `OfferLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary` to the `OfferLetter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `OfferLetter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OfferLetterStatus" AS ENUM ('draft', 'pending', 'sent', 'viewed', 'accepted', 'declined', 'negotiating', 'expired', 'withdrawn');

-- AlterTable
ALTER TABLE "OfferLetter" ADD COLUMN     "candidateResponse" TEXT,
ADD COLUMN     "candidateSignature" JSONB,
ADD COLUMN     "companySignature" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "emailOpenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "employmentType" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "negotiationNote" TEXT,
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "salary" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "templateId" TEXT,
ADD COLUMN     "viewedAt" TIMESTAMP(3),
ADD COLUMN     "whatsappSentAt" TIMESTAMP(3),
ALTER COLUMN "filePath" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OfferLetterStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "sentAt" DROP NOT NULL,
ALTER COLUMN "sentAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OfferTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferTemplate_companyId_idx" ON "OfferTemplate"("companyId");

-- CreateIndex
CREATE INDEX "OfferTemplate_isDefault_idx" ON "OfferTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "OfferLetter_status_idx" ON "OfferLetter"("status");

-- CreateIndex
CREATE INDEX "OfferLetter_sentAt_idx" ON "OfferLetter"("sentAt");

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OfferTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferTemplate" ADD CONSTRAINT "OfferTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
