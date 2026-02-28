-- Enforce max team size at DB level (1 team = max 5 members)
CREATE OR REPLACE FUNCTION "public"."enforce_team_member_limit"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  member_count INTEGER;
BEGIN
  IF NEW."teamId" IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."teamId" IS NOT DISTINCT FROM NEW."teamId" THEN
    RETURN NEW;
  END IF;

  -- Serialize concurrent joins/removals for the same team.
  PERFORM 1
  FROM "public"."Team" t
  WHERE t."id" = NEW."teamId"
  FOR UPDATE;

  SELECT COUNT(*)
  INTO member_count
  FROM "public"."User" u
  WHERE u."teamId" = NEW."teamId"
    AND u."id" <> NEW."id";

  IF member_count >= 5 THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Team member limit exceeded (max 5).';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "user_team_member_limit_trigger" ON "public"."User";

CREATE TRIGGER "user_team_member_limit_trigger"
BEFORE INSERT OR UPDATE OF "teamId" ON "public"."User"
FOR EACH ROW
EXECUTE FUNCTION "public"."enforce_team_member_limit"();
