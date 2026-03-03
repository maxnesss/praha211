-- Create table for per-member leader votes
CREATE TABLE "public"."TeamLeaderVote" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "candidateUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TeamLeaderVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamLeaderVote_teamId_userId_key" ON "public"."TeamLeaderVote"("teamId", "userId");
CREATE INDEX "TeamLeaderVote_teamId_candidateUserId_idx" ON "public"."TeamLeaderVote"("teamId", "candidateUserId");
CREATE INDEX "TeamLeaderVote_userId_idx" ON "public"."TeamLeaderVote"("userId");
CREATE INDEX "TeamLeaderVote_candidateUserId_idx" ON "public"."TeamLeaderVote"("candidateUserId");

ALTER TABLE "public"."TeamLeaderVote"
ADD CONSTRAINT "TeamLeaderVote_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."TeamLeaderVote"
ADD CONSTRAINT "TeamLeaderVote_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."TeamLeaderVote"
ADD CONSTRAINT "TeamLeaderVote_candidateUserId_fkey"
FOREIGN KEY ("candidateUserId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one default vote per existing member (vote for current team leader)
INSERT INTO "public"."TeamLeaderVote" (
  "id",
  "teamId",
  "userId",
  "candidateUserId",
  "createdAt",
  "updatedAt"
)
SELECT
  'seed_' || md5(t."id" || ':' || u."id"),
  t."id",
  u."id",
  t."leaderUserId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "public"."Team" t
JOIN "public"."User" u ON u."teamId" = t."id"
ON CONFLICT ("teamId", "userId") DO NOTHING;
