UPDATE "User"
SET "nickname" = CONCAT(
  LEFT(
    COALESCE(
      NULLIF(BTRIM("name"), ''),
      NULLIF(SPLIT_PART("email", '@', 1), ''),
      'hrac'
    ),
    30
  ),
  '-',
  RIGHT("id", 8)
)
WHERE "nickname" IS NULL OR BTRIM("nickname") = '';

ALTER TABLE "User"
ALTER COLUMN "nickname" SET NOT NULL;
