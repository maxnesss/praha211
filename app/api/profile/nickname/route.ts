import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "profile.nickname.update.denied" },
    async () => {
      const authResult = await requireAuthedUser({
        request,
        rateLimit: {
          prefix: "profile-nickname",
          max: 8,
          windowMs: 10 * 60 * 1000,
          message: "Příliš mnoho požadavků. Zkuste to prosím později.",
        },
      });
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      return NextResponse.json(
        { message: "Přezdívku po registraci nelze změnit." },
        { status: 403 },
      );
    },
  );
}
