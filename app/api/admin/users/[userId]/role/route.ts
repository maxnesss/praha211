import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminUserRoleContext = {
  params: Promise<{ userId: string }>;
};

export async function POST(_request: Request, context: AdminUserRoleContext) {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Uživatel nebyl nalezen." },
      { status: 404 },
    );
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { message: "Uživatel už je ADMIN." },
      { status: 200 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ message: "Role byla povýšena na ADMIN." }, { status: 200 });
}
