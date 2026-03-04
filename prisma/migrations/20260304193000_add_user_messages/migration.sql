CREATE TYPE "public"."MessageCategory" AS ENUM (
  'DIRECT',
  'TEAM_BROADCAST',
  'GLOBAL_BROADCAST',
  'BADGE_UNLOCK',
  'SYSTEM'
);

CREATE TABLE "public"."UserMessage" (
  "id" TEXT NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "senderUserId" TEXT,
  "category" "public"."MessageCategory" NOT NULL DEFAULT 'DIRECT',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "dedupeKey" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMessage_recipientUserId_dedupeKey_key"
  ON "public"."UserMessage"("recipientUserId", "dedupeKey");
CREATE INDEX "UserMessage_recipientUserId_createdAt_idx"
  ON "public"."UserMessage"("recipientUserId", "createdAt");
CREATE INDEX "UserMessage_recipientUserId_readAt_createdAt_idx"
  ON "public"."UserMessage"("recipientUserId", "readAt", "createdAt");
CREATE INDEX "UserMessage_senderUserId_createdAt_idx"
  ON "public"."UserMessage"("senderUserId", "createdAt");
CREATE INDEX "UserMessage_category_createdAt_idx"
  ON "public"."UserMessage"("category", "createdAt");

ALTER TABLE "public"."UserMessage"
ADD CONSTRAINT "UserMessage_recipientUserId_fkey"
FOREIGN KEY ("recipientUserId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."UserMessage"
ADD CONSTRAINT "UserMessage_senderUserId_fkey"
FOREIGN KEY ("senderUserId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
