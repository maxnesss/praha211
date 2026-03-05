import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AdminUserRoleContext = {
  params: Promise<{ userId: string }>;
};

export async function POST(_request: Request, context: AdminUserRoleContext) {
  return withApiWriteObservability(
    { request: _request, operation: "admin.user.promote" },
    async () => {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
      }

      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Nemáte oprávnění." }, { status: 403 });
      }

      const rateLimited = await applyRateLimit({
        request: _request,
        prefix: "admin-user-role",
        userId: session.user.id,
        max: 45,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho administrátorských požadavků. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
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
    },
  );
}
