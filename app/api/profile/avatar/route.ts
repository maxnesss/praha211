import { NextResponse } from "next/server";
import {
  parseJsonWithSchema,
  requireAuthedUser,
} from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { prisma } from "@/lib/prisma";
import {
  getProfileValidationMessage,
  updateAvatarSchema,
} from "@/lib/validation/profile";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "profile.avatar.update" },
    async () => {
  const authResult = await requireAuthedUser({
    request,
    rateLimit: {
      prefix: "profile-avatar",
      max: 12,
      windowMs: 10 * 60 * 1000,
      message: "Příliš mnoho pokusů o změnu avataru. Zkuste to prosím později.",
    },
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    const parsedBody = await parseJsonWithSchema({
      request,
      schema: updateAvatarSchema,
      getValidationMessage: getProfileValidationMessage,
    });
    if (parsedBody instanceof NextResponse) {
      return parsedBody;
    }
    const { data } = parsedBody;

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: data.avatar },
      select: { id: true },
    });

    return NextResponse.json({ message: "Avatar byl uložen." });
  } catch (error) {
    console.error("Uložení avataru selhalo:", error);
    return NextResponse.json(
      { message: "Avatar se nepodařilo uložit." },
      { status: 500 },
    );
  }
    },
  );
}
