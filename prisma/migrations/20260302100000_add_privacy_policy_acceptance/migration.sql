-- Add GDPR acceptance timestamp for user registrations
ALTER TABLE "public"."User"
ADD COLUMN "privacyPolicyAcceptedAt" TIMESTAMP(3);
