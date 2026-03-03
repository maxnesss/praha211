import { NextResponse } from "next/server";
import {
  parseJsonWithSchema,
  requireAuthedUser,
} from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";
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

    await runSerializableTransactionWithRetry(async (tx) => {
      const account = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, teamId: true },
      });

      if (!account) {
        throw new Error("USER_NOT_FOUND");
      }

      if (account.teamId) {
        const team = await tx.team.findUnique({
          where: { id: account.teamId },
          select: { id: true, leaderUserId: true },
        });

        if (team?.leaderUserId === userId) {
          const successor = await tx.user.findFirst({
            where: {
              teamId: team.id,
              id: { not: userId },
            },
            select: { id: true },
            orderBy: { createdAt: "asc" },
          });

          if (!successor) {
            throw new Error("LEADER_NO_SUCCESSOR");
          }

          await tx.team.update({
            where: { id: team.id },
            data: { leaderUserId: successor.id },
            select: { id: true },
          });
        }
      }

      await tx.user.delete({
        where: { id: userId },
        select: { id: true },
      });
    });

    return NextResponse.json({ message: "Účet byl odstraněn." });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "Uživatel nebyl nalezen." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "LEADER_NO_SUCCESSOR") {
      return NextResponse.json(
        {
          message:
            "Účet teď nelze odstranit, protože jste poslední člen týmu. Nejprve předejte velení dalšímu hráči.",
        },
        { status: 409 },
      );
    }

    if (isSerializableConflictError(error)) {
      return NextResponse.json(
        { message: "Probíhá souběžná změna týmů. Zkuste to prosím znovu." },
        { status: 409 },
      );
    }

    console.error("Odstranění účtu selhalo:", error);
    return NextResponse.json(
      { message: "Účet se nepodařilo odstranit." },
      { status: 500 },
    );
  }
    },
  );
}
