-- Create enum for join request workflow
CREATE TYPE "public"."TeamJoinRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- Add team leader reference
ALTER TABLE "public"."Team"
ADD COLUMN "leaderUserId" TEXT;

-- Backfill leader from current team members (earliest created member)
UPDATE "public"."Team" t
SET "leaderUserId" = sub."id"
FROM (
  SELECT DISTINCT ON (u."teamId") u."teamId", u."id"
  FROM "public"."User" u
  WHERE u."teamId" IS NOT NULL
  ORDER BY u."teamId", u."createdAt" ASC
) sub
WHERE sub."teamId" = t."id";

-- Remove empty teams without members, so leader can be required
DELETE FROM "public"."Team"
WHERE "leaderUserId" IS NULL;

ALTER TABLE "public"."Team"
ALTER COLUMN "leaderUserId" SET NOT NULL;

CREATE UNIQUE INDEX "Team_leaderUserId_key" ON "public"."Team"("leaderUserId");
CREATE INDEX "Team_leaderUserId_idx" ON "public"."Team"("leaderUserId");

ALTER TABLE "public"."Team"
ADD CONSTRAINT "Team_leaderUserId_fkey"
FOREIGN KEY ("leaderUserId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Join request queue table
CREATE TABLE "public"."TeamJoinRequest" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "public"."TeamJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "respondedAt" TIMESTAMP(3),

  CONSTRAINT "TeamJoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamJoinRequest_teamId_userId_key" ON "public"."TeamJoinRequest"("teamId", "userId");
CREATE INDEX "TeamJoinRequest_teamId_status_idx" ON "public"."TeamJoinRequest"("teamId", "status");
CREATE INDEX "TeamJoinRequest_userId_status_idx" ON "public"."TeamJoinRequest"("userId", "status");

ALTER TABLE "public"."TeamJoinRequest"
ADD CONSTRAINT "TeamJoinRequest_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."TeamJoinRequest"
ADD CONSTRAINT "TeamJoinRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
