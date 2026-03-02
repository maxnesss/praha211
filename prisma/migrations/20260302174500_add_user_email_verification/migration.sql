ALTER TABLE "public"."User"
ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationTokenHash" TEXT,
ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3);
