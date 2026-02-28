import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminUserFreezeContext = {
  params: Promise<{ userId: string }>;
};

type FreezePayload = {
  frozen?: boolean;
};

export async function POST(request: Request, context: AdminUserFreezeContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Nemáte oprávnění." }, { status: 403 });
  }

  const { userId } = await context.params;

  if (userId === session.user.id) {
    return NextResponse.json(
      { message: "Nemůžete měnit vlastní účet." },
      { status: 400 },
    );
  }

  let payload: FreezePayload | null = null;
  try {
    payload = (await request.json()) as FreezePayload;
  } catch {
    payload = null;
  }

  if (typeof payload?.frozen !== "boolean") {
    return NextResponse.json(
      { message: "Neplatný požadavek." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isFrozen: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Uživatel nebyl nalezen." },
      { status: 404 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isFrozen: payload.frozen },
  });

  return NextResponse.json(
    {
      message: payload.frozen
        ? "Uživatel byl zmrazen."
        : "Zmrazení účtu bylo zrušeno.",
    },
    { status: 200 },
  );
}
