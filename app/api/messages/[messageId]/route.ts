import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import { getUserUnreadMessageCount } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";

type DeleteMessageRouteContext = {
  params: Promise<{ messageId: string }>;
};

export async function DELETE(request: Request, context: DeleteMessageRouteContext) {
  return withApiWriteObservability(
    { request, operation: "messages.delete" },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
      }

      const rateLimited = await applyRateLimit({
        request,
        prefix: "messages-delete",
        userId,
        max: 60,
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

      const deleted = await prisma.userMessage.deleteMany({
        where: {
          id: messageId,
          recipientUserId: userId,
        },
      });

      if (deleted.count === 0) {
        return NextResponse.json(
          { message: "Zpráva nebyla nalezena." },
          { status: 404 },
        );
      }

      const unreadCount = await getUserUnreadMessageCount(userId);

      return NextResponse.json({
        message: "Zpráva byla smazána.",
        unreadCount,
      });
    },
  );
}
