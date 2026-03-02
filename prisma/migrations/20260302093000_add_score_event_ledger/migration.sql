-- CreateEnum
CREATE TYPE "public"."ScoreEventType" AS ENUM ('DISTRICT_CLAIM', 'CHAPTER_COMPLETE', 'PRAHA_PART_COMPLETE');

-- CreateTable
CREATE TABLE "public"."ScoreEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "public"."ScoreEventType" NOT NULL,
    "eventKey" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoreEvent_userId_occurredAt_idx" ON "public"."ScoreEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "ScoreEvent_eventType_idx" ON "public"."ScoreEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreEvent_userId_eventKey_key" ON "public"."ScoreEvent"("userId", "eventKey");

-- AddForeignKey
ALTER TABLE "public"."ScoreEvent" ADD CONSTRAINT "ScoreEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill claim-based score events for existing claims
INSERT INTO "public"."ScoreEvent" (
  "id",
  "userId",
  "eventType",
  "eventKey",
  "points",
  "occurredAt",
  "metadata"
)
SELECT
  CONCAT('claim:', c."id"),
  c."userId",
  'DISTRICT_CLAIM'::"public"."ScoreEventType",
  CONCAT('district_claim:', UPPER(c."districtCode")),
  c."awardedPoints",
  c."claimedAt",
  jsonb_build_object(
    'districtCode', c."districtCode",
    'chapterSlug', c."chapterSlug"
  )
FROM "public"."DistrictClaim" c
ON CONFLICT ("userId", "eventKey") DO UPDATE
SET
  "eventType" = EXCLUDED."eventType",
  "points" = EXCLUDED."points",
  "occurredAt" = EXCLUDED."occurredAt",
  "metadata" = EXCLUDED."metadata";

-- Backfill chapter completion bonus events for existing fully-completed chapters
INSERT INTO "public"."ScoreEvent" (
  "id",
  "userId",
  "eventType",
  "eventKey",
  "points",
  "occurredAt",
  "metadata"
)
SELECT
  CONCAT('chapter:', cp."userId", ':', cp."chapterSlug"),
  cp."userId",
  'CHAPTER_COMPLETE'::"public"."ScoreEventType",
  CONCAT('chapter_complete:', cp."chapterSlug"),
  750,
  cp."occurredAt",
  jsonb_build_object('chapterSlug', cp."chapterSlug")
FROM (
  SELECT
    c."userId",
    c."chapterSlug",
    COUNT(*)::int AS "completedCount",
    MAX(c."claimedAt") AS "occurredAt"
  FROM "public"."DistrictClaim" c
  GROUP BY c."userId", c."chapterSlug"
) cp
WHERE cp."completedCount" = 16
ON CONFLICT ("userId", "eventKey") DO UPDATE
SET
  "eventType" = EXCLUDED."eventType",
  "points" = EXCLUDED."points",
  "occurredAt" = EXCLUDED."occurredAt",
  "metadata" = EXCLUDED."metadata";
