import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { getDirectMessageRecipientOptions } from "@/lib/messaging";

const DEFAULT_RECIPIENT_LIMIT = 8;
const MAX_RECIPIENT_LIMIT = 20;
const RECIPIENT_MIN_QUERY_LENGTH = 2;

function parseRecipientLimit(value: string | null) {
  if (!value) {
    return DEFAULT_RECIPIENT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_RECIPIENT_LIMIT;
  }

  return Math.min(Math.max(parsed, 1), MAX_RECIPIENT_LIMIT);
}

export async function GET(request: Request) {
  const authResult = await requireAuthedUser({
    request,
    rateLimit: {
      prefix: "messages-recipient-search",
      max: 120,
      windowMs: 5 * 60 * 1000,
      message: "Příliš mnoho hledání příjemců. Zkuste to prosím za chvíli.",
    },
  });

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limit = parseRecipientLimit(url.searchParams.get("limit"));

  if (query.length < RECIPIENT_MIN_QUERY_LENGTH) {
    return NextResponse.json({ recipients: [] });
  }

  const recipients = await getDirectMessageRecipientOptions(authResult.userId, {
    query,
    limit,
  });

  return NextResponse.json({ recipients });
}
