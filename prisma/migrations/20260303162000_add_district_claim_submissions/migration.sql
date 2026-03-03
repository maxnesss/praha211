-- CreateEnum
CREATE TYPE "ClaimSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "DistrictClaimSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "chapterSlug" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "attestVisited" BOOLEAN NOT NULL DEFAULT true,
    "attestSignVisible" BOOLEAN NOT NULL DEFAULT true,
    "status" "ClaimSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "localFaceCount" INTEGER NOT NULL DEFAULT 0,
    "localFaceDetected" BOOLEAN NOT NULL DEFAULT false,
    "localDistrictMatched" BOOLEAN NOT NULL DEFAULT false,
    "localConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localMatchedAlias" TEXT,
    "localOcrText" TEXT,
    "localReasons" JSONB,
    "localValidatedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "approvedClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistrictClaimSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DistrictClaimSubmission_approvedClaimId_key" ON "DistrictClaimSubmission"("approvedClaimId");

-- CreateIndex
CREATE INDEX "DistrictClaimSubmission_status_createdAt_idx" ON "DistrictClaimSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DistrictClaimSubmission_userId_status_createdAt_idx" ON "DistrictClaimSubmission"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DistrictClaimSubmission_districtCode_status_createdAt_idx" ON "DistrictClaimSubmission"("districtCode", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DistrictClaimSubmission_reviewedByUserId_idx" ON "DistrictClaimSubmission"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "DistrictClaimSubmission" ADD CONSTRAINT "DistrictClaimSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistrictClaimSubmission" ADD CONSTRAINT "DistrictClaimSubmission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistrictClaimSubmission" ADD CONSTRAINT "DistrictClaimSubmission_approvedClaimId_fkey" FOREIGN KEY ("approvedClaimId") REFERENCES "DistrictClaim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
