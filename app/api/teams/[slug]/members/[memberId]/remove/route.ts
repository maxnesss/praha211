import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";
import { synchronizeTeamLeaderByVotes } from "@/lib/team-leader-voting";

type RemoveTeamMemberRouteContext = {
  params: Promise<{ slug: string; memberId: string }>;
};

export async function POST(
  request: Request,
  context: RemoveTeamMemberRouteContext,
) {
  return withApiWriteObservability(
    { request, operation: "teams.member.remove" },
    async () => {
  const authResult = await requireAuthedUser({
    request,
    rateLimit: {
      prefix: "teams-remove-member",
      max: 15,
      windowMs: 5 * 60 * 1000,
      message: "Příliš mnoho pokusů o odebrání hráče. Zkuste to prosím později.",
    },
  });
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId } = authResult;

  const { slug, memberId } = await context.params;

  try {
    await runSerializableTransactionWithRetry(async (tx) => {
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

      await tx.teamLeaderVote.deleteMany({
        where: {
          teamId: team.id,
          OR: [
            { userId: memberId },
            { candidateUserId: memberId },
          ],
        },
      });

      await synchronizeTeamLeaderByVotes(tx, team.id);
    });

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

    if (isSerializableConflictError(error)) {
      return NextResponse.json(
        { message: "Probíhá souběžná změna týmů. Zkuste to prosím znovu." },
        { status: 409 },
      );
    }

    console.error("Odebrání hráče z týmu selhalo:", error);
    return NextResponse.json(
      { message: "Hráče se nepodařilo odebrat z týmu." },
      { status: 500 },
    );
  }
    },
  );
}
