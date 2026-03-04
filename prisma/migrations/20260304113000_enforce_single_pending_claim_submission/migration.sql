-- Keep only the newest pending submission per user+district before adding uniqueness.
WITH ranked_pending AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userId", "districtCode"
      ORDER BY "createdAt" DESC, "id" DESC
    ) AS "rank"
  FROM "DistrictClaimSubmission"
  WHERE "status" = 'PENDING'
)
UPDATE "DistrictClaimSubmission" AS dcs
SET
  "status" = 'REJECTED',
  "reviewNote" = COALESCE(NULLIF(dcs."reviewNote", ''), 'Automaticky zamítnuto: duplicitní pending žádost.'),
  "reviewedAt" = COALESCE(dcs."reviewedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
FROM ranked_pending
WHERE dcs."id" = ranked_pending."id"
  AND ranked_pending."rank" > 1;

-- Enforce at DB level: at most one pending submission per user+district.
CREATE UNIQUE INDEX IF NOT EXISTS "DistrictClaimSubmission_single_pending_per_user_district_key"
ON "DistrictClaimSubmission" ("userId", "districtCode")
WHERE "status" = 'PENDING';
