import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ApplyTeamRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: ApplyTeamRouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    const team = await prisma.$transaction(
      async (tx) => {
        const [teamRecord, user] = await Promise.all([
          tx.team.findUnique({
            where: { slug },
            select: { id: true, name: true, slug: true, leaderUserId: true },
          }),
          tx.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
          }),
        ]);

        if (!teamRecord) {
          throw new Error("TEAM_NOT_FOUND");
        }

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        if (user.teamId) {
          throw new Error("ALREADY_IN_TEAM");
        }

        if (teamRecord.leaderUserId === userId) {
          throw new Error("ALREADY_LEADER");
        }

        const existing = await tx.teamJoinRequest.findUnique({
          where: {
            teamId_userId: {
              teamId: teamRecord.id,
              userId,
            },
          },
          select: { id: true, status: true },
        });

        if (existing?.status === "PENDING") {
          throw new Error("ALREADY_APPLIED");
        }

        await tx.teamJoinRequest.upsert({
          where: {
            teamId_userId: {
              teamId: teamRecord.id,
              userId,
            },
          },
          create: {
            teamId: teamRecord.id,
            userId,
            status: "PENDING",
          },
          update: {
            status: "PENDING",
            respondedAt: null,
          },
        });

        return teamRecord;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({
      message: `Žádost o vstup do týmu ${team.name} byla odeslána.`,
      team,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TEAM_NOT_FOUND") {
      return NextResponse.json({ message: "Tým nebyl nalezen." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "Uživatel nebyl nalezen." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "ALREADY_IN_TEAM") {
      return NextResponse.json(
        { message: "Už jste členem jiného týmu. Nejprve ho opusťte." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "ALREADY_LEADER") {
      return NextResponse.json(
        { message: "Jste velitel tohoto týmu." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "ALREADY_APPLIED") {
      return NextResponse.json(
        { message: "Žádost už čeká na schválení velitelem." },
        { status: 409 },
      );
    }

    console.error("Žádost o vstup do týmu selhala:", error);
    return NextResponse.json(
      { message: "Žádost o vstup se nepodařilo odeslat." },
      { status: 500 },
    );
  }
}
