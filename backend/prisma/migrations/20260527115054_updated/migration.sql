/*
  Warnings:

  - The values [reviewed,shortlisted,interview,offer] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('applied', 'screened', 'technical_round', 'hr_round', 'offer_sent', 'hired', 'rejected');
ALTER TABLE "public"."Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "ApplicationStatus_new" USING ("status"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'applied';
COMMIT;

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "pipelineIndex" INTEGER NOT NULL DEFAULT 0;
