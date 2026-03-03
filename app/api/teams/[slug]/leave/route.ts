import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";
import { getPublicPlayerName } from "@/lib/team-utils";
import { getTeamValidationMessage, leaveTeamSchema } from "@/lib/validation/team";

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

      let body: unknown = {};
      try {
        body = (await request.json()) as unknown;
      } catch {
        body = {};
      }

      const parsed = leaveTeamSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: getTeamValidationMessage(parsed.error) },
          { status: 400 },
        );
      }

      const { slug } = await context.params;
      const preferredSuccessorUserId = parsed.data.successorUserId ?? null;

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

          let successorDisplayName: string | null = null;

          if (team.leaderUserId === userId) {
            let successor: {
              id: string;
              nickname: string | null;
              name: string | null;
              email: string | null;
            } | null = null;

            if (preferredSuccessorUserId) {
              const preferred = await tx.user.findUnique({
                where: { id: preferredSuccessorUserId },
                select: {
                  id: true,
                  teamId: true,
                  nickname: true,
                  name: true,
                  email: true,
                },
              });

              if (
                !preferred
                || preferred.id === userId
                || preferred.teamId !== team.id
              ) {
                throw new Error("LEADER_SUCCESSOR_NOT_FOUND");
              }

              successor = {
                id: preferred.id,
                nickname: preferred.nickname,
                name: preferred.name,
                email: preferred.email,
              };
            } else {
              successor = await tx.user.findFirst({
                where: {
                  teamId: team.id,
                  id: { not: userId },
                },
                select: {
                  id: true,
                  nickname: true,
                  name: true,
                  email: true,
                },
                orderBy: { createdAt: "asc" },
              });
            }

            if (!successor) {
              throw new Error("LEADER_NO_SUCCESSOR");
            }

            await tx.team.update({
              where: { id: team.id },
              data: { leaderUserId: successor.id },
              select: { id: true },
            });

            successorDisplayName = getPublicPlayerName(successor);
          }

          await tx.user.update({
            where: { id: userId },
            data: { teamId: null },
            select: { id: true },
          });

          return {
            successorDisplayName,
          };
        });

        return NextResponse.json({
          message: result.successorDisplayName
            ? `Tým jste opustili. Velení převzal hráč ${result.successorDisplayName}.`
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

        if (error instanceof Error && error.message === "LEADER_SUCCESSOR_NOT_FOUND") {
          return NextResponse.json(
            { message: "Zvolený nástupce není členem tohoto týmu." },
            { status: 409 },
          );
        }

        if (error instanceof Error && error.message === "LEADER_NO_SUCCESSOR") {
          return NextResponse.json(
            {
              message:
                "V týmu není další člen, kterému by šlo předat velení. Nejprve pozvěte dalšího hráče.",
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

        console.error("Opuštění týmu selhalo:", error);
        return NextResponse.json(
          { message: "Tým se nepodařilo opustit." },
          { status: 500 },
        );
      }
    },
  );
}
