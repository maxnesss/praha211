import { NextResponse } from "next/server";
import {
  parseJsonWithSchema,
  requireAuthedUser,
} from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { prisma } from "@/lib/prisma";
import { deleteUserSelfieObjects } from "@/lib/storage/selfie-cleanup";
import {
  deleteAccountSchema,
  getProfileValidationMessage,
} from "@/lib/validation/profile";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "profile.account.delete" },
    async () => {
  const authResult = await requireAuthedUser({
    request,
    rateLimit: {
      prefix: "profile-delete-account",
      max: 4,
      windowMs: 10 * 60 * 1000,
      message: "Příliš mnoho pokusů o odstranění účtu. Zkuste to prosím později.",
    },
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  try {
    const parsedBody = await parseJsonWithSchema({
      request,
      schema: deleteAccountSchema,
      getValidationMessage: getProfileValidationMessage,
    });
    if (parsedBody instanceof NextResponse) {
      return parsedBody;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        claims: {
          select: { selfieUrl: true },
        },
        claimSubmissions: {
          select: { selfieUrl: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Uživatel nebyl nalezen." }, { status: 404 });
    }

    try {
      await deleteUserSelfieObjects({
        userId,
        selfieKeys: [
          ...user.claims.map((claim) => claim.selfieUrl),
          ...user.claimSubmissions.map((submission) => submission.selfieUrl),
        ],
      });
    } catch (error) {
      console.error("Mazání selfie při odstranění účtu selhalo:", error);
      return NextResponse.json(
        { message: "Nepodařilo se odstranit nahraná selfie. Zkuste to prosím znovu." },
        { status: 500 },
      );
    }

    await prisma.user.delete({
      where: { id: userId },
      select: { id: true },
    });

    return NextResponse.json({ message: "Účet byl odstraněn." });
  } catch (error) {
    console.error("Odstranění účtu selhalo:", error);
    return NextResponse.json(
      { message: "Účet se nepodařilo odstranit." },
      { status: 500 },
    );
  }
    },
  );
}
