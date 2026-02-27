import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TEAM_MAX_MEMBERS } from "@/lib/team-utils";

type ApproveJoinRequestRouteContext = {
  params: Promise<{ slug: string; requestId: string }>;
};

export async function POST(
  _request: Request,
  context: ApproveJoinRequestRouteContext,
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { slug, requestId } = await context.params;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const [team, request] = await Promise.all([
          tx.team.findUnique({
            where: { slug },
            select: { id: true, name: true, leaderUserId: true },
          }),
          tx.teamJoinRequest.findUnique({
            where: { id: requestId },
            select: {
              id: true,
              teamId: true,
              userId: true,
              status: true,
            },
          }),
        ]);

        if (!team) {
          throw new Error("TEAM_NOT_FOUND");
        }

        if (team.leaderUserId !== userId) {
          throw new Error("FORBIDDEN");
        }

        if (!request || request.teamId !== team.id) {
          throw new Error("REQUEST_NOT_FOUND");
        }

        if (request.status !== "PENDING") {
          throw new Error("REQUEST_NOT_PENDING");
        }

        const applicant = await tx.user.findUnique({
          where: { id: request.userId },
          select: { teamId: true },
        });

        if (!applicant) {
          throw new Error("APPLICANT_NOT_FOUND");
        }

        if (applicant.teamId) {
          throw new Error("APPLICANT_ALREADY_IN_TEAM");
        }

        const membersCount = await tx.user.count({
          where: { teamId: team.id },
        });

        if (membersCount >= TEAM_MAX_MEMBERS) {
          throw new Error("TEAM_FULL");
        }

        const moved = await tx.user.updateMany({
          where: { id: request.userId, teamId: null },
          data: { teamId: team.id },
        });

        if (moved.count !== 1) {
          throw new Error("APPLICANT_CHANGED");
        }

        await tx.teamJoinRequest.update({
          where: { id: request.id },
          data: {
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
          select: { id: true },
        });

        await tx.teamJoinRequest.updateMany({
          where: {
            userId: request.userId,
            status: "PENDING",
            id: { not: request.id },
          },
          data: {
            status: "REJECTED",
            respondedAt: new Date(),
          },
        });

        return team;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({
      message: `Žádost byla schválena. Hráč přidán do týmu ${result.name}.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TEAM_NOT_FOUND") {
      return NextResponse.json({ message: "Tým nebyl nalezen." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Tuto akci může provést pouze velitel týmu." },
        { status: 403 },
      );
    }

    if (error instanceof Error && error.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json({ message: "Žádost nebyla nalezena." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "REQUEST_NOT_PENDING") {
      return NextResponse.json(
        { message: "Žádost už byla zpracována." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "APPLICANT_NOT_FOUND") {
      return NextResponse.json(
        { message: "Žadatel nebyl nalezen." },
        { status: 404 },
      );
    }

    if (
      error instanceof Error
      && (error.message === "APPLICANT_ALREADY_IN_TEAM" || error.message === "APPLICANT_CHANGED")
    ) {
      return NextResponse.json(
        { message: "Žadatel už je členem jiného týmu." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "TEAM_FULL") {
      return NextResponse.json(
        { message: "Tým je plný (max. 5 hráčů)." },
        { status: 409 },
      );
    }

    console.error("Schválení žádosti selhalo:", error);
    return NextResponse.json(
      { message: "Žádost se nepodařilo schválit." },
      { status: 500 },
    );
  }
}
