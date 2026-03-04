import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import { getUserUnreadMessageCount } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";

type ReadMessageRouteContext = {
  params: Promise<{ messageId: string }>;
};

export async function POST(request: Request, context: ReadMessageRouteContext) {
  return withApiWriteObservability(
    { request, operation: "messages.read_one" },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
      }

      const rateLimited = await applyRateLimit({
        request,
        prefix: "messages-read-one",
        userId,
        max: 90,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho požadavků. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
      }

      const { messageId } = await context.params;
      if (!messageId.trim()) {
        return NextResponse.json(
          { message: "Chybí ID zprávy." },
          { status: 400 },
        );
      }

      const now = new Date();
      const updated = await prisma.userMessage.updateMany({
        where: {
          id: messageId,
          recipientUserId: userId,
          readAt: null,
        },
        data: {
          readAt: now,
        },
      });

      if (updated.count === 0) {
        const existing = await prisma.userMessage.findFirst({
          where: {
            id: messageId,
            recipientUserId: userId,
          },
          select: {
            id: true,
            readAt: true,
          },
        });

        if (!existing) {
          return NextResponse.json(
            { message: "Zpráva nebyla nalezena." },
            { status: 404 },
          );
        }
      }

      const unreadCount = await getUserUnreadMessageCount(userId);

      return NextResponse.json({
        message: "Zpráva byla označena jako přečtená.",
        unreadCount,
      });
    },
  );
}
