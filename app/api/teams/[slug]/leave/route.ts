import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LeaveTeamRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: LeaveTeamRouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    await prisma.$transaction(
      async (tx) => {
        const [team, user] = await Promise.all([
          tx.team.findUnique({
            where: { slug },
            select: { id: true, leaderUserId: true },
          }),
          tx.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
          }),
        ]);

        if (!team) {
          throw new Error("TEAM_NOT_FOUND");
        }

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        if (user.teamId !== team.id) {
          throw new Error("NOT_MEMBER");
        }

        if (team.leaderUserId === userId) {
          throw new Error("LEADER_CANNOT_LEAVE");
        }

        await tx.user.update({
          where: { id: userId },
          data: { teamId: null },
          select: { id: true },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({
      message: "Tým jste úspěšně opustili.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TEAM_NOT_FOUND") {
      return NextResponse.json(
        { message: "Tým nebyl nalezen." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { message: "Uživatel nebyl nalezen." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "NOT_MEMBER") {
      return NextResponse.json(
        { message: "Nejste členem tohoto týmu." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "LEADER_CANNOT_LEAVE") {
      return NextResponse.json(
        { message: "Velitel nemůže odejít z týmu. Nejprve odeberte členy." },
        { status: 409 },
      );
    }

    console.error("Opuštění týmu selhalo:", error);
    return NextResponse.json(
      { message: "Tým se nepodařilo opustit." },
      { status: 500 },
    );
  }
}
