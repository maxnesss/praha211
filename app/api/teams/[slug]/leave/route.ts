import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";
import { synchronizeTeamLeaderByVotes } from "@/lib/team-leader-voting";

type LeaveTeamRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: LeaveTeamRouteContext) {
  return withApiWriteObservability(
    { request, operation: "teams.leave" },
    async () => {
      const authResult = await requireAuthedUser({
        request,
        rateLimit: {
          prefix: "teams-leave",
          max: 8,
          windowMs: 5 * 60 * 1000,
          message: "Příliš mnoho pokusů o opuštění týmu. Zkuste to prosím později.",
        },
      });
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      const { userId } = authResult;

      const { slug } = await context.params;

      try {
        const result = await runSerializableTransactionWithRetry(async (tx) => {
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
            const otherMemberCount = await tx.user.count({
              where: {
                teamId: team.id,
                id: { not: userId },
              },
            });

            if (otherMemberCount === 0) {
              await tx.team.delete({
                where: { id: team.id },
                select: { id: true },
              });

              return {
                teamDeleted: true,
                leaderDisplayName: null,
                changed: false,
              };
            }
          }

          await tx.user.update({
            where: { id: userId },
            data: { teamId: null },
            select: { id: true },
          });

          await tx.teamLeaderVote.deleteMany({
            where: {
              teamId: team.id,
              OR: [
                { userId },
                { candidateUserId: userId },
              ],
            },
          });

          const synced = await synchronizeTeamLeaderByVotes(tx, team.id);
          return {
            ...synced,
            teamDeleted: false,
          };
        });

        return NextResponse.json({
          message: result.teamDeleted
            ? "Tým jste opustili. Tým byl zrušen, protože neměl další členy."
            : result.changed && result.leaderDisplayName
              ? `Tým jste opustili. Novým velitelem je ${result.leaderDisplayName}.`
              : "Tým jste úspěšně opustili.",
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

        if (isSerializableConflictError(error)) {
          return NextResponse.json(
            { message: "Probíhá souběžná změna týmů. Zkuste to prosím znovu." },
            { status: 409 },
          );
        }

        console.error("Opuštění týmu selhalo:", error);
        return NextResponse.json(
          { message: "Tým se nepodařilo opustit." },
          { status: 500 },
        );
      }
    },
  );
}
