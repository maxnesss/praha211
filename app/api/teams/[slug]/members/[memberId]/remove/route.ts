import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RemoveTeamMemberRouteContext = {
  params: Promise<{ slug: string; memberId: string }>;
};

export async function POST(
  _request: Request,
  context: RemoveTeamMemberRouteContext,
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { slug, memberId } = await context.params;

  try {
    await prisma.$transaction(
      async (tx) => {
        const team = await tx.team.findUnique({
          where: { slug },
          select: { id: true, leaderUserId: true },
        });

        if (!team) {
          throw new Error("TEAM_NOT_FOUND");
        }

        if (team.leaderUserId !== userId) {
          throw new Error("FORBIDDEN");
        }

        if (memberId === userId) {
          throw new Error("CANNOT_REMOVE_LEADER");
        }

        const member = await tx.user.findUnique({
          where: { id: memberId },
          select: { teamId: true },
        });

        if (!member || member.teamId !== team.id) {
          throw new Error("MEMBER_NOT_FOUND");
        }

        await tx.user.update({
          where: { id: memberId },
          data: { teamId: null },
          select: { id: true },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json({
      message: "Hráč byl odebrán z týmu.",
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

    if (error instanceof Error && error.message === "CANNOT_REMOVE_LEADER") {
      return NextResponse.json(
        { message: "Velitel nemůže odebrat sám sebe." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "MEMBER_NOT_FOUND") {
      return NextResponse.json(
        { message: "Hráč nebyl v tomto týmu nalezen." },
        { status: 404 },
      );
    }

    console.error("Odebrání hráče z týmu selhalo:", error);
    return NextResponse.json(
      { message: "Hráče se nepodařilo odebrat z týmu." },
      { status: 500 },
    );
  }
}
