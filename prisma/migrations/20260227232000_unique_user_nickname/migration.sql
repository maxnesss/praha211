WITH ranked_nicknames AS (
  SELECT
    u."id",
    u."nickname",
    ROW_NUMBER() OVER (
      PARTITION BY u."nickname"
      ORDER BY u."createdAt" ASC, u."id" ASC
    ) AS "rank"
  FROM "public"."User" u
  WHERE u."nickname" IS NOT NULL
)
UPDATE "public"."User" u
SET "nickname" = LEFT(r."nickname", 31) || '-' || RIGHT(u."id", 8)
FROM ranked_nicknames r
WHERE u."id" = r."id"
  AND r."rank" > 1;

CREATE UNIQUE INDEX "User_nickname_key" ON "public"."User"("nickname");
