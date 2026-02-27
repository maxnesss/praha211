import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toTeamSlug } from "@/lib/team-utils";
import { createTeamSchema, getTeamValidationMessage } from "@/lib/validation/team";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const rateLimited = applyRateLimit({
    request,
    prefix: "teams-create",
    userId,
    max: 5,
    windowMs: 60 * 60 * 1000,
    message: "Příliš mnoho pokusů o vytvoření týmu. Zkuste to prosím později.",
  });
  if (rateLimited) {
    return rateLimited;
  }

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      { message: "Neplatné tělo požadavku." },
      { status: 400 },
    );
  }

  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: getTeamValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  const slug = toTeamSlug(parsed.data.name);
  if (slug.length < 2) {
    return NextResponse.json(
      { message: "Název týmu je neplatný." },
      { status: 400 },
    );
  }

  try {
    const team = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, teamId: true },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        if (user.teamId) {
          throw new Error("ALREADY_IN_TEAM");
        }

        return tx.team.create({
          data: {
            name: parsed.data.name,
            slug,
            leader: {
              connect: { id: user.id },
            },
            users: {
              connect: { id: user.id },
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json(
      {
        message: "Tým byl vytvořen.",
        team,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { message: "Uživatel nebyl nalezen." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "ALREADY_IN_TEAM") {
      return NextResponse.json(
        { message: "Nejdřív opusťte svůj současný tým." },
        { status: 409 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Tým s tímto názvem už existuje. Zvolte jiný název." },
        { status: 409 },
      );
    }

    console.error("Vytvoření týmu selhalo:", error);
    return NextResponse.json(
      { message: "Tým se nepodařilo vytvořit." },
      { status: 500 },
    );
  }
}
