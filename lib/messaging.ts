import type { MessageCategory, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPublicPlayerName } from "@/lib/team-utils";

const DEFAULT_INBOX_LIMIT = 80;
const MAX_INBOX_LIMIT = 200;
const DEFAULT_DIRECT_RECIPIENT_LIMIT = 8;
const MAX_DIRECT_RECIPIENT_LIMIT = 30;

type MessagingDbClient = Pick<PrismaClient, "user" | "userMessage"> | Prisma.TransactionClient;

function normalizeInboxLimit(limit?: number) {
  const parsed = Number.isFinite(limit) ? Math.floor(Number(limit)) : DEFAULT_INBOX_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_INBOX_LIMIT);
}

function normalizeDirectRecipientLimit(limit?: number) {
  const parsed = Number.isFinite(limit)
    ? Math.floor(Number(limit))
    : DEFAULT_DIRECT_RECIPIENT_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_DIRECT_RECIPIENT_LIMIT);
}

export type UserInboxMessage = {
  id: string;
  category: MessageCategory;
  title: string;
  body: string;
  createdAtIso: string;
  readAtIso: string | null;
  senderUserId: string | null;
  senderDisplayName: string;
};

export type DirectMessageRecipientOption = {
  userId: string;
  displayName: string;
  teamName: string | null;
};

export type TeamMessagingContext = {
  teamId: string;
  teamName: string;
  recipientUserIds: string[];
  recipientCount: number;
};

function toDirectMessageRecipientOption(user: {
  id: string;
  nickname: string;
  name: string | null;
  email: string;
  team: { name: string } | null;
}): DirectMessageRecipientOption {
  return {
    userId: user.id,
    displayName: getPublicPlayerName(user),
    teamName: user.team?.name ?? null,
  };
}

export async function getUserUnreadMessageCount(
  userId: string,
  db: MessagingDbClient = prisma,
) {
  return db.userMessage.count({
    where: {
      recipientUserId: userId,
      readAt: null,
    },
  });
}

export async function getUserInboxMessages(
  userId: string,
  input?: { limit?: number; db?: MessagingDbClient },
): Promise<UserInboxMessage[]> {
  const db = input?.db ?? prisma;
  const limit = normalizeInboxLimit(input?.limit);

  const messages = await db.userMessage.findMany({
    where: { recipientUserId: userId },
    select: {
      id: true,
      category: true,
      title: true,
      body: true,
      createdAt: true,
      readAt: true,
      sender: {
        select: {
          id: true,
          nickname: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return messages.map((message) => ({
    id: message.id,
    category: message.category,
    title: message.title,
    body: message.body,
    createdAtIso: message.createdAt.toISOString(),
    readAtIso: message.readAt?.toISOString() ?? null,
    senderUserId: message.sender?.id ?? null,
    senderDisplayName: message.sender
      ? getPublicPlayerName(message.sender)
      : "Systém PRAHA 112",
  }));
}

export async function getDirectMessageRecipientOptions(
  currentUserId: string,
  input?: {
    query?: string;
    limit?: number;
    db?: MessagingDbClient;
  },
): Promise<DirectMessageRecipientOption[]> {
  const db = input?.db ?? prisma;
  const limit = normalizeDirectRecipientLimit(input?.limit);
  const query = input?.query?.trim() ?? "";

  const users = await db.user.findMany({
    where: {
      id: { not: currentUserId },
      isFrozen: false,
      ...(query.length > 0
        ? {
            OR: [
              {
                nickname: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                team: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nickname: true,
      name: true,
      email: true,
      team: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { nickname: "asc" },
      { createdAt: "asc" },
    ],
    take: limit,
  });

  return users.map(toDirectMessageRecipientOption);
}

export async function findDirectMessageRecipientOption(
  currentUserId: string,
  value: string,
  db: MessagingDbClient = prisma,
): Promise<DirectMessageRecipientOption | null> {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const byId = await db.user.findUnique({
    where: { id: trimmed },
    select: {
      id: true,
      nickname: true,
      name: true,
      email: true,
      isFrozen: true,
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  if (byId && byId.id !== currentUserId && !byId.isFrozen) {
    return toDirectMessageRecipientOption(byId);
  }

  const byNickname = await db.user.findFirst({
    where: {
      id: { not: currentUserId },
      isFrozen: false,
      nickname: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      nickname: true,
      name: true,
      email: true,
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  return byNickname ? toDirectMessageRecipientOption(byNickname) : null;
}

export async function getTeamMessagingContextForUser(
  userId: string,
  db: MessagingDbClient = prisma,
): Promise<TeamMessagingContext | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      team: {
        select: {
          id: true,
          name: true,
          users: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!user?.team) {
    return null;
  }

  const recipientUserIds = user.team.users
    .map((member) => member.id)
    .filter((memberId) => memberId !== userId);

  return {
    teamId: user.team.id,
    teamName: user.team.name,
    recipientUserIds,
    recipientCount: recipientUserIds.length,
  };
}

type CreateMessagesForRecipientsInput = {
  recipientUserIds: string[];
  senderUserId?: string | null;
  category: MessageCategory;
  title: string;
  body: string;
  dedupeKey?: string | null;
  db?: MessagingDbClient;
};

export async function createMessagesForRecipients(input: CreateMessagesForRecipientsInput) {
  const db = input.db ?? prisma;
  const recipientUserIds = [...new Set(
    input.recipientUserIds
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  )];

  if (recipientUserIds.length === 0) {
    return 0;
  }

  const title = input.title.trim();
  const body = input.body.trim();
  const dedupeKey = input.dedupeKey?.trim() || null;

  const result = await db.userMessage.createMany({
    data: recipientUserIds.map((recipientUserId) => ({
      recipientUserId,
      senderUserId: input.senderUserId ?? null,
      category: input.category,
      title,
      body,
      dedupeKey,
    })),
    skipDuplicates: dedupeKey !== null,
  });

  return result.count;
}
