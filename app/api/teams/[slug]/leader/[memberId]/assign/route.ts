import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";
import { getPublicPlayerName } from "@/lib/team-utils";

type AssignTeamLeaderRouteContext = {
  params: Promise<{ slug: string; memberId: string }>;
};

export async function POST(
  request: Request,
  context: AssignTeamLeaderRouteContext,
) {
  return withApiWriteObservability(
    { request, operation: "teams.leader.assign" },
    async () => {
      const authResult = await requireAuthedUser({
        request,
        rateLimit: {
          prefix: "teams-assign-leader",
          max: 20,
          windowMs: 5 * 60 * 1000,
          message: "Příliš mnoho pokusů o předání velení. Zkuste to prosím později.",
        },
      });
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      const { userId } = authResult;

      const { slug, memberId } = await context.params;

      try {
        const result = await runSerializableTransactionWithRetry(async (tx) => {
          const team = await tx.team.findUnique({
            where: { slug },
            select: {
              id: true,
              name: true,
              leaderUserId: true,
            },
          });

          if (!team) {
            throw new Error("TEAM_NOT_FOUND");
          }

          if (team.leaderUserId !== userId) {
            throw new Error("FORBIDDEN");
          }

          if (memberId === userId) {
            throw new Error("ALREADY_LEADER");
          }

          const member = await tx.user.findUnique({
            where: { id: memberId },
            select: {
              id: true,
              teamId: true,
              nickname: true,
              name: true,
              email: true,
            },
          });

          if (!member || member.teamId !== team.id) {
            throw new Error("MEMBER_NOT_FOUND");
          }

          await tx.team.update({
            where: { id: team.id },
            data: {
              leaderUserId: member.id,
            },
            select: { id: true },
          });

          return {
            teamName: team.name,
            memberDisplayName: getPublicPlayerName(member),
          };
        });

        return NextResponse.json({
          message: `Velení týmu ${result.teamName} bylo předáno hráči ${result.memberDisplayName}.`,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "TEAM_NOT_FOUND") {
          return NextResponse.json(
            { message: "Tým nebyl nalezen." },
            { status: 404 },
          );
        }

        if (error instanceof Error && error.message === "FORBIDDEN") {
          return NextResponse.json(
            { message: "Tuto akci může provést pouze velitel týmu." },
            { status: 403 },
          );
        }

        if (error instanceof Error && error.message === "ALREADY_LEADER") {
          return NextResponse.json(
            { message: "Jste už velitelem týmu." },
            { status: 409 },
          );
        }

        if (error instanceof Error && error.message === "MEMBER_NOT_FOUND") {
          return NextResponse.json(
            { message: "Vybraný hráč není členem tohoto týmu." },
            { status: 404 },
          );
        }

        if (isSerializableConflictError(error)) {
          return NextResponse.json(
            { message: "Probíhá souběžná změna týmů. Zkuste to prosím znovu." },
            { status: 409 },
          );
        }

        console.error("Předání velení týmu selhalo:", error);
        return NextResponse.json(
          { message: "Velení se nepodařilo předat." },
          { status: 500 },
        );
      }
    },
  );
}
