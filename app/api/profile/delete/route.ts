import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
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
import { synchronizeTeamLeaderByVotes } from "@/lib/team-leader-voting";
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
          passwordHash: true,
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

    const currentPassword = parsedBody.data.currentPassword?.trim() ?? "";
    const selfieKeys = [
      ...user.claims.map((claim) => claim.selfieUrl),
      ...user.claimSubmissions.map((submission) => submission.selfieUrl),
    ];

    if (user.passwordHash) {
      if (currentPassword.length === 0) {
        return NextResponse.json(
          { message: "Zadejte aktuální heslo." },
          { status: 400 },
        );
      }

      const matches = await compare(currentPassword, user.passwordHash);
      if (!matches) {
        return NextResponse.json(
          { message: "Aktuální heslo není správné." },
          { status: 400 },
        );
      }
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
        const teamId = account.teamId;

        const team = await tx.team.findUnique({
          where: { id: teamId },
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

        await tx.user.update({
          where: { id: userId },
          data: { teamId: null },
          select: { id: true },
        });

        await tx.teamLeaderVote.deleteMany({
          where: {
            teamId,
            OR: [
              { userId },
              { candidateUserId: userId },
            ],
          },
        });

        await synchronizeTeamLeaderByVotes(tx, teamId);
      }

      await tx.user.delete({
        where: { id: userId },
        select: { id: true },
      });
    });

    if (selfieKeys.length > 0) {
      try {
        await deleteUserSelfieObjects({
          userId,
          selfieKeys,
        });
      } catch (error) {
        console.error(
          "Účet byl odstraněn, ale mazání selfie objektů selhalo:",
          error,
        );
      }
    }

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
