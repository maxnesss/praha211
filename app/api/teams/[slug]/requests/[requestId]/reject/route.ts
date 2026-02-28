import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  isSerializableConflictError,
  runSerializableTransactionWithRetry,
} from "@/lib/db/serializable-transaction";

type RejectJoinRequestRouteContext = {
  params: Promise<{ slug: string; requestId: string }>;
};

export async function POST(
  _request: Request,
  context: RejectJoinRequestRouteContext,
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { slug, requestId } = await context.params;

  try {
    await runSerializableTransactionWithRetry(async (tx) => {
      const [team, request] = await Promise.all([
        tx.team.findUnique({
          where: { slug },
          select: { id: true, leaderUserId: true },
        }),
        tx.teamJoinRequest.findUnique({
          where: { id: requestId },
          select: { id: true, teamId: true, status: true },
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

      await tx.teamJoinRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
        },
        select: { id: true },
      });
    });

    return NextResponse.json({
      message: "Žádost byla zamítnuta.",
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

    if (isSerializableConflictError(error)) {
      return NextResponse.json(
        { message: "Probíhá souběžná změna týmů. Zkuste to prosím znovu." },
        { status: 409 },
      );
    }

    console.error("Zamítnutí žádosti selhalo:", error);
    return NextResponse.json(
      { message: "Žádost se nepodařilo zamítnout." },
      { status: 500 },
    );
  }
}
