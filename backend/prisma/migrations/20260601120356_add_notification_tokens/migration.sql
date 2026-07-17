-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "coreValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "corporateLink" TEXT,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "officeLocations" JSONB,
ADD COLUMN     "products" JSONB,
ADD COLUMN     "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "youtubeLink" TEXT;
