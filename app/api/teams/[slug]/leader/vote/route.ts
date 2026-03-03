import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";
import { synchronizeTeamLeaderByVotes } from "@/lib/team-leader-voting";
import { getTeamValidationMessage, voteTeamLeaderSchema } from "@/lib/validation/team";

type VoteTeamLeaderRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: VoteTeamLeaderRouteContext) {
  return withApiWriteObservability(
    { request, operation: "teams.leader.vote" },
    async () => {
      const authResult = await requireAuthedUser({
        request,
        rateLimit: {
          prefix: "teams-leader-vote",
          max: 30,
          windowMs: 5 * 60 * 1000,
          message: "Příliš mnoho hlasování v krátkém čase. Zkuste to prosím později.",
        },
      });
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      const { userId } = authResult;

      let body: unknown;
      try {
        body = (await request.json()) as unknown;
      } catch {
        return NextResponse.json(
          { message: "Neplatné tělo požadavku." },
          { status: 400 },
        );
      }

      const parsed = voteTeamLeaderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: getTeamValidationMessage(parsed.error) },
          { status: 400 },
        );
      }

      const { slug } = await context.params;

      try {
        const result = await runSerializableTransactionWithRetry(async (tx) => {
          const [team, voter] = await Promise.all([
            tx.team.findUnique({
              where: { slug },
              select: { id: true },
            }),
            tx.user.findUnique({
              where: { id: userId },
              select: { teamId: true },
            }),
          ]);

          if (!team) {
            throw new Error("TEAM_NOT_FOUND");
          }

          if (!voter || voter.teamId !== team.id) {
            throw new Error("NOT_MEMBER");
          }

          const candidate = await tx.user.findUnique({
            where: { id: parsed.data.candidateUserId },
            select: { id: true, teamId: true },
          });
          if (!candidate || candidate.teamId !== team.id) {
            throw new Error("CANDIDATE_NOT_MEMBER");
          }

          await tx.teamLeaderVote.upsert({
            where: {
              teamId_userId: {
                teamId: team.id,
                userId,
              },
            },
            create: {
              teamId: team.id,
              userId,
              candidateUserId: candidate.id,
            },
            update: {
              candidateUserId: candidate.id,
            },
            select: { id: true },
          });

          return synchronizeTeamLeaderByVotes(tx, team.id);
        });

        return NextResponse.json({
          message: result.changed && result.leaderDisplayName
            ? `Hlas byl uložen. Novým velitelem je ${result.leaderDisplayName}.`
            : "Hlas byl uložen.",
        });
      } catch (error) {
        if (error instanceof Error && error.message === "TEAM_NOT_FOUND") {
          return NextResponse.json({ message: "Tým nebyl nalezen." }, { status: 404 });
        }

        if (error instanceof Error && error.message === "NOT_MEMBER") {
          return NextResponse.json(
            { message: "Nejste členem tohoto týmu." },
            { status: 409 },
          );
        }

        if (error instanceof Error && error.message === "CANDIDATE_NOT_MEMBER") {
          return NextResponse.json(
            { message: "Pro velitele lze hlasovat jen pro člena vašeho týmu." },
            { status: 409 },
          );
        }

        if (isSerializableConflictError(error)) {
          return NextResponse.json(
            { message: "Probíhá souběžná změna týmů. Zkuste to prosím znovu." },
            { status: 409 },
          );
        }

        console.error("Hlasování o veliteli selhalo:", error);
        return NextResponse.json(
          { message: "Hlas se nepodařilo uložit." },
          { status: 500 },
        );
      }
    },
  );
}
