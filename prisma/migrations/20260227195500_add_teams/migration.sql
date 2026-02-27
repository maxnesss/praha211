CREATE TABLE "public"."Team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."User"
ADD COLUMN "teamId" TEXT;

CREATE UNIQUE INDEX "Team_slug_key" ON "public"."Team"("slug");
CREATE INDEX "User_teamId_idx" ON "public"."User"("teamId");

ALTER TABLE "public"."User"
ADD CONSTRAINT "User_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
