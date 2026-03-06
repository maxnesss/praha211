import { MessageCategory } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import {
  createMessagesForRecipients,
  getTeamMessagingContextForUser,
} from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import {
  getMessagingValidationMessage,
  sendMessageSchema,
} from "@/lib/validation/messaging";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "messages.send" },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
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

      const parsed = sendMessageSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: getMessagingValidationMessage(parsed.error) },
          { status: 400 },
        );
      }

      const mode = parsed.data.mode;
      const rateLimited = await applyRateLimit({
        request,
        prefix: `messages-send-${mode.toLowerCase()}`,
        userId,
        max: mode === "ALL_USERS" ? 6 : 30,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho zpráv v krátkém čase. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
      }

      const title = parsed.data.title.trim();
      const bodyText = parsed.data.body.trim();

      if (mode === "DIRECT") {
        const recipientUserId = parsed.data.recipientUserId?.trim() ?? "";
        const recipientNickname = parsed.data.recipientNickname?.trim() ?? "";

        const recipient = recipientUserId
          ? await prisma.user.findUnique({
              where: { id: recipientUserId },
              select: { id: true, isFrozen: true },
            })
          : await prisma.user.findFirst({
              where: {
                nickname: {
                  equals: recipientNickname,
                  mode: "insensitive",
                },
              },
              select: { id: true, isFrozen: true },
            });

        if (!recipient || recipient.isFrozen) {
          return NextResponse.json(
            { message: "Příjemce nebyl nalezen." },
            { status: 404 },
          );
        }

        if (recipient.id === userId) {
          return NextResponse.json(
            { message: "Nemůžete poslat zprávu sami sobě." },
            { status: 400 },
          );
        }

        await prisma.userMessage.create({
          data: {
            recipientUserId: recipient.id,
            senderUserId: userId,
            category: MessageCategory.DIRECT,
            title,
            body: bodyText,
          },
        });

        return NextResponse.json(
          { message: "Zpráva byla odeslána.", sentCount: 1 },
          { status: 201 },
        );
      }

      if (mode === "TEAM") {
        const teamContext = await getTeamMessagingContextForUser(userId);

        if (!teamContext) {
          return NextResponse.json(
            { message: "Nejste členem týmu." },
            { status: 403 },
          );
        }

        if (teamContext.recipientCount === 0) {
          return NextResponse.json(
            { message: "V týmu není žádný další hráč, kterému lze zprávu poslat." },
            { status: 409 },
          );
        }

        const sentCount = await createMessagesForRecipients({
          recipientUserIds: teamContext.recipientUserIds,
          senderUserId: userId,
          category: MessageCategory.TEAM_BROADCAST,
          title,
          body: bodyText,
        });

        return NextResponse.json(
          {
            message: `Týmová zpráva byla odeslána (${sentCount} příjemců).`,
            sentCount,
          },
          { status: 201 },
        );
      }

      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { message: "Tuto akci může provést pouze ADMIN." },
          { status: 403 },
        );
      }

      const recipients = await prisma.user.findMany({
        where: {
          id: { not: userId },
          isFrozen: false,
        },
        select: { id: true },
      });

      if (recipients.length === 0) {
        return NextResponse.json(
          { message: "Nenalezeni žádní příjemci." },
          { status: 409 },
        );
      }

      const sentCount = await createMessagesForRecipients({
        recipientUserIds: recipients.map((recipient) => recipient.id),
        senderUserId: userId,
        category: MessageCategory.GLOBAL_BROADCAST,
        title,
        body: bodyText,
      });

      return NextResponse.json(
        {
          message: `Hromadná zpráva byla odeslána (${sentCount} uživatelů).`,
          sentCount,
        },
        { status: 201 },
      );
    },
  );
}
