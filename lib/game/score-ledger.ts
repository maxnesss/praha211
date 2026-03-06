import type { Prisma, PrismaClient, ScoreEventType } from "@prisma/client";
import {
  CHAPTERS,
  type ChapterSlug,
} from "./district-catalog.ts";
import {
  ACHIEVEMENT_BADGE_DIFFICULTY_POINTS,
  PRAHA_BADGE_NUMBERS,
  buildBadgeOverview,
  getPrahaBadgeDistrictCodes,
} from "./badges.ts";
import { prisma } from "../prisma.ts";

export const SCORE_EVENT_TYPE = {
  districtClaim: "DISTRICT_CLAIM",
  chapterComplete: "CHAPTER_COMPLETE",
  prahaPartComplete: "PRAHA_PART_COMPLETE",
  achievementBadgeUnlock: "ACHIEVEMENT_BADGE_UNLOCK",
} as const satisfies Record<string, ScoreEventType>;

export const SCORE_POINT_VALUES = {
  chapterComplete: 750,
  prahaPartComplete: 300,
  achievementBadgeUnlockByDifficulty: ACHIEVEMENT_BADGE_DIFFICULTY_POINTS,
} as const;

const MANAGED_SCORE_EVENT_TYPES: ScoreEventType[] = [
  SCORE_EVENT_TYPE.districtClaim,
  SCORE_EVENT_TYPE.chapterComplete,
  SCORE_EVENT_TYPE.prahaPartComplete,
  SCORE_EVENT_TYPE.achievementBadgeUnlock,
];

type ScoreDbClient = Pick<PrismaClient, "districtClaim" | "scoreEvent" | "user">
  | Prisma.TransactionClient;

type ScoreClaimSnapshot = {
  districtCode: string;
  chapterSlug: string;
  awardedPoints: number;
  claimedAt: Date;
};

function toClaimEventKey(districtCode: string) {
  return `district_claim:${districtCode.toUpperCase()}`;
}

function toChapterCompleteEventKey(chapterSlug: string) {
  return `chapter_complete:${chapterSlug}`;
}

function toPrahaPartCompleteEventKey(number: number) {
  return `praha_part_complete:${number}`;
}

function toAchievementBadgeUnlockEventKey(badgeId: string) {
  return `achievement_badge_unlock:${badgeId}`;
}

function maxDate(values: Date[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce(
    (latest, value) => (value.getTime() > latest.getTime() ? value : latest),
    values[0],
  );
}

type ScoreBadgeContext = {
  joinedTeam: boolean;
  hasBeenTeamLeader: boolean;
  userCreatedAt: Date;
};

function buildManagedScoreEventsForClaims(
  userId: string,
  claims: ScoreClaimSnapshot[],
  badgeContext: ScoreBadgeContext,
): Prisma.ScoreEventUncheckedCreateInput[] {
  if (claims.length === 0) {
    const emptyOverview = buildBadgeOverview(new Set<string>(), {
      joinedTeam: badgeContext.joinedTeam,
      hasBeenTeamLeader: badgeContext.hasBeenTeamLeader,
    });

    return emptyOverview.achievementBadges
      .filter((badge) => badge.unlocked)
      .map((badge) => ({
        userId,
        eventType: SCORE_EVENT_TYPE.achievementBadgeUnlock,
        eventKey: toAchievementBadgeUnlockEventKey(badge.id),
        points: SCORE_POINT_VALUES.achievementBadgeUnlockByDifficulty[badge.difficulty],
        occurredAt: badgeContext.userCreatedAt,
        metadata: {
          badgeId: badge.id,
          category: badge.category,
          difficulty: badge.difficulty,
        } satisfies Prisma.JsonObject,
      }));
  }

  const claimByDistrict = new Map(
    claims.map((claim) => [claim.districtCode.toUpperCase(), claim] as const),
  );
  const completedCodes = new Set([...claimByDistrict.keys()]);
  const claimDates = claims.map((claim) => claim.claimedAt);
  const badges = buildBadgeOverview(completedCodes, {
    claimDates,
    joinedTeam: badgeContext.joinedTeam,
    hasBeenTeamLeader: badgeContext.hasBeenTeamLeader,
  });

  const chapterLatestClaimedAt = new Map<ChapterSlug, Date>();
  for (const chapter of CHAPTERS) {
    const latest = maxDate(
      claims
        .filter((claim) => claim.chapterSlug === chapter.slug)
        .map((claim) => claim.claimedAt),
    );

    if (latest) {
      chapterLatestClaimedAt.set(chapter.slug, latest);
    }
  }

  const claimEvents: Prisma.ScoreEventUncheckedCreateInput[] = claims.map((claim) => ({
    userId,
    eventType: SCORE_EVENT_TYPE.districtClaim,
    eventKey: toClaimEventKey(claim.districtCode),
    points: claim.awardedPoints,
    occurredAt: claim.claimedAt,
    metadata: {
      districtCode: claim.districtCode,
      chapterSlug: claim.chapterSlug,
    } satisfies Prisma.JsonObject,
  }));

  const chapterEvents: Prisma.ScoreEventUncheckedCreateInput[] = badges.chapterBadges
    .filter((badge) => badge.unlocked)
    .map((badge) => {
      const occurredAt = chapterLatestClaimedAt.get(badge.slug);
      return occurredAt
        ? {
            userId,
            eventType: SCORE_EVENT_TYPE.chapterComplete,
            eventKey: toChapterCompleteEventKey(badge.slug),
            points: SCORE_POINT_VALUES.chapterComplete,
            occurredAt,
            metadata: {
              chapterSlug: badge.slug,
            } satisfies Prisma.JsonObject,
          }
        : null;
    })
    .filter((value) => value !== null);

  const prahaEvents: Prisma.ScoreEventUncheckedCreateInput[] = PRAHA_BADGE_NUMBERS
    .map((number) => {
      const badge = badges.prahaBadges.find((entry) => entry.number === number);
      if (!badge?.unlocked) {
        return null;
      }

      const latest = maxDate(
        getPrahaBadgeDistrictCodes(number)
          .map((code) => claimByDistrict.get(code.toUpperCase())?.claimedAt)
          .filter((value): value is Date => Boolean(value)),
      );

      if (!latest) {
        return null;
      }

      return {
        userId,
        eventType: SCORE_EVENT_TYPE.prahaPartComplete,
        eventKey: toPrahaPartCompleteEventKey(number),
        points: SCORE_POINT_VALUES.prahaPartComplete,
        occurredAt: latest,
        metadata: {
          prahaNumber: number,
        } satisfies Prisma.JsonObject,
      } satisfies Prisma.ScoreEventUncheckedCreateInput;
    })
    .filter((value) => value !== null);

  const fallbackAchievementOccurredAt = maxDate(claimDates) ?? badgeContext.userCreatedAt;
  const achievementEvents: Prisma.ScoreEventUncheckedCreateInput[] = badges.achievementBadges
    .filter((badge) => badge.unlocked)
    .map((badge) => ({
      userId,
      eventType: SCORE_EVENT_TYPE.achievementBadgeUnlock,
      eventKey: toAchievementBadgeUnlockEventKey(badge.id),
      points: SCORE_POINT_VALUES.achievementBadgeUnlockByDifficulty[badge.difficulty],
      occurredAt: fallbackAchievementOccurredAt,
      metadata: {
        badgeId: badge.id,
        category: badge.category,
        difficulty: badge.difficulty,
      } satisfies Prisma.JsonObject,
    }));

  return [...claimEvents, ...chapterEvents, ...prahaEvents, ...achievementEvents];
}

type SyncScoreEventsInput = {
  db: ScoreDbClient;
  userId: string;
  claims?: ScoreClaimSnapshot[];
};

export type UserScoreTimelineEvent = {
  id: string;
  eventType: ScoreEventType;
  eventKey: string;
  points: number;
  occurredAt: Date;
  metadata: Prisma.JsonValue | null;
};

export async function syncUserScoreEvents(input: SyncScoreEventsInput) {
  const [claims, user] = await Promise.all([
    input.claims
      ?? input.db.districtClaim.findMany({
        where: { userId: input.userId },
        select: {
          districtCode: true,
          chapterSlug: true,
          awardedPoints: true,
          claimedAt: true,
        },
      }),
    input.db.user.findUnique({
      where: { id: input.userId },
      select: {
        teamId: true,
        hasJoinedTeam: true,
        hasBeenTeamLeader: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    return;
  }

  const nextEvents = buildManagedScoreEventsForClaims(input.userId, claims, {
    joinedTeam: Boolean(user.hasJoinedTeam || user.teamId),
    hasBeenTeamLeader: Boolean(user.hasBeenTeamLeader),
    userCreatedAt: user.createdAt,
  });
  const nextEventKeys = nextEvents.map((event) => event.eventKey);

  if (nextEventKeys.length === 0) {
    await input.db.scoreEvent.deleteMany({
      where: {
        userId: input.userId,
        eventType: { in: MANAGED_SCORE_EVENT_TYPES },
      },
    });
    return;
  }

  await input.db.scoreEvent.deleteMany({
    where: {
      userId: input.userId,
      eventType: { in: MANAGED_SCORE_EVENT_TYPES },
      eventKey: { notIn: nextEventKeys },
    },
  });

  for (const event of nextEvents) {
    await input.db.scoreEvent.upsert({
      where: {
        userId_eventKey: {
          userId: input.userId,
          eventKey: event.eventKey,
        },
      },
      create: event,
      update: {
        eventType: event.eventType,
        points: event.points,
        occurredAt: event.occurredAt,
        metadata: event.metadata,
      },
    });
  }
}

export async function getUserScoreTotal(userId: string) {
  const aggregate = await prisma.scoreEvent.aggregate({
    where: { userId },
    _sum: { points: true },
  });

  return aggregate._sum.points ?? 0;
}

export async function getUserScoreTimeline(userId: string, limit = 80): Promise<UserScoreTimelineEvent[]> {
  const parsedLimit = Number.isFinite(limit) ? Math.floor(limit) : 80;
  const safeLimit = Math.min(Math.max(parsedLimit, 1), 200);

  return prisma.scoreEvent.findMany({
    where: { userId },
    select: {
      id: true,
      eventType: true,
      eventKey: true,
      points: true,
      occurredAt: true,
      metadata: true,
    },
    orderBy: [
      { occurredAt: "desc" },
      { id: "desc" },
    ],
    take: safeLimit,
  });
}

export async function getUserScoreTotalsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>();
  }

  const grouped = await prisma.scoreEvent.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { points: true },
  });

  return new Map(
    grouped.map((entry) => [entry.userId, entry._sum.points ?? 0] as const),
  );
}
