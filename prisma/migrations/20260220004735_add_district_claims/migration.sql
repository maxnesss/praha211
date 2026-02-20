-- CreateTable
CREATE TABLE "public"."DistrictClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "chapterSlug" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "selfieUrl" TEXT NOT NULL,
    "signVisible" BOOLEAN NOT NULL DEFAULT true,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "basePoints" INTEGER NOT NULL,
    "sameDayMultiplier" DOUBLE PRECISION NOT NULL,
    "streakBonus" INTEGER NOT NULL,
    "awardedPoints" INTEGER NOT NULL,

    CONSTRAINT "DistrictClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistrictClaim_userId_claimedAt_idx" ON "public"."DistrictClaim"("userId", "claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DistrictClaim_userId_districtCode_key" ON "public"."DistrictClaim"("userId", "districtCode");

-- AddForeignKey
ALTER TABLE "public"."DistrictClaim" ADD CONSTRAINT "DistrictClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

