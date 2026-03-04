import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { isNicknameTaken } from "@/lib/nickname-utils";
import { getFirstZodErrorMessage, nicknameSchema } from "@/lib/validation/auth";

export async function GET(request: Request) {
  return withApiWriteObservability(
    { request, operation: "auth.nickname.availability" },
    async () => {
      const rateLimited = await applyRateLimit({
        request,
        prefix: "auth-nickname-availability",
        max: 100,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho kontrol přezdívky. Zkuste to prosím za chvíli.",
      });
      if (rateLimited) {
        return rateLimited;
      }

      const { searchParams } = new URL(request.url);
      const parsedNickname = nicknameSchema.safeParse(
        searchParams.get("nickname") ?? "",
      );
      if (!parsedNickname.success) {
        return NextResponse.json(
          { message: getFirstZodErrorMessage(parsedNickname.error) },
          { status: 400 },
        );
      }

      const taken = await isNicknameTaken(parsedNickname.data);
      return NextResponse.json(
        {
          available: !taken,
          message: taken
            ? "Tuto přezdívku už používá jiný hráč."
            : "Přezdívka je volná.",
        },
        { status: 200 },
      );
    },
  );
}
