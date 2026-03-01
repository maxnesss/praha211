import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  parseJsonWithSchema,
  requireAuthedUser,
} from "@/lib/api/route-hardening";
import { isNicknameTaken } from "@/lib/nickname-utils";
import { prisma } from "@/lib/prisma";
import {
  getProfileValidationMessage,
  updateNicknameSchema,
} from "@/lib/validation/profile";

export async function POST(request: Request) {
  const authResult = await requireAuthedUser({
    request,
    rateLimit: {
      prefix: "profile-nickname",
      max: 8,
      windowMs: 10 * 60 * 1000,
      message: "Příliš mnoho pokusů o změnu přezdívky. Zkuste to prosím později.",
    },
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    const parsedBody = await parseJsonWithSchema({
      request,
      schema: updateNicknameSchema,
      getValidationMessage: getProfileValidationMessage,
    });
    if (parsedBody instanceof NextResponse) {
      return parsedBody;
    }
    const { data } = parsedBody;

    if (data.nickname) {
      const taken = await isNicknameTaken(data.nickname, userId);
      if (taken) {
        return NextResponse.json(
          { message: "Tuto přezdívku už používá jiný hráč." },
          { status: 409 },
        );
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { nickname: data.nickname },
      select: { id: true },
    });

    return NextResponse.json({ message: "Přezdívka byla uložena." });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Tuto přezdívku už používá jiný hráč." },
        { status: 409 },
      );
    }

    console.error("Uložení přezdívky selhalo:", error);
    return NextResponse.json(
      { message: "Přezdívku se nepodařilo uložit." },
      { status: 500 },
    );
  }
}
