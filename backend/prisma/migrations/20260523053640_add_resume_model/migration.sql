-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originalFilePath" TEXT,
    "rawText" TEXT,
    "htmlContent" TEXT,
    "autoCorrectedText" TEXT,
    "atsScore" INTEGER,
    "atsBreakdown" JSONB,
    "strengths" TEXT[],
    "improvements" JSONB,
    "missingSections" TEXT[],
    "keywordGaps" TEXT[],
    "parsedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
