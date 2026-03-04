import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import { getUserUnreadMessageCount } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "messages.read_all" },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
      }

      const rateLimited = await applyRateLimit({
        request,
        prefix: "messages-read-all",
        userId,
        max: 60,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho požadavků. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
      }

      const now = new Date();
      const updated = await prisma.userMessage.updateMany({
        where: {
          recipientUserId: userId,
          readAt: null,
        },
        data: {
          readAt: now,
        },
      });

      const unreadCount = await getUserUnreadMessageCount(userId);

      return NextResponse.json({
        message: updated.count > 0
          ? `Označeno ${updated.count} zpráv jako přečtené.`
          : "Nemáte žádné nepřečtené zprávy.",
        updatedCount: updated.count,
        unreadCount,
      });
    },
  );
}
