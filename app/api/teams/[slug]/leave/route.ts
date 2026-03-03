import { NextResponse } from "next/server";
import { requireAuthedUser } from "@/lib/api/route-hardening";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";

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
    await runSerializableTransactionWithRetry(async (tx) => {
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
    });

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
