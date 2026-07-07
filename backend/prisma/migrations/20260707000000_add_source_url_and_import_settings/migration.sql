-- AlterTable Article: add sourceUrl
ALTER TABLE "Article" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex: sourceUrl must be unique when not null
CREATE UNIQUE INDEX "Article_sourceUrl_key" ON "Article"("sourceUrl");

-- CreateTable ImportSettings
CREATE TABLE "ImportSettings" (
    "id" TEXT NOT NULL,
    "driveAccessToken" TEXT,
    "driveRefreshToken" TEXT,
    "driveTokenExpiry" TIMESTAMP(3),
    "confluenceBaseUrl" TEXT,
    "confluenceEmail" TEXT,
    "confluenceToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportSettings_pkey" PRIMARY KEY ("id")
);
