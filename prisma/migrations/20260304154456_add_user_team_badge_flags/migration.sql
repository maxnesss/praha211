ALTER TABLE "User"
ADD COLUMN "hasJoinedTeam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasBeenTeamLeader" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "hasJoinedTeam" = true
WHERE "teamId" IS NOT NULL;

UPDATE "User" u
SET "hasBeenTeamLeader" = true
WHERE EXISTS (
  SELECT 1
  FROM "Team" t
  WHERE t."leaderUserId" = u."id"
);
