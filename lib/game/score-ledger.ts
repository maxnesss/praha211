import type { Prisma, PrismaClient, ScoreEventType } from "@prisma/client";
import {
  CHAPTERS,
  type ChapterSlug,
} from "./district-catalog.ts";
import {
  PRAHA_BADGE_NUMBERS,
  buildBadgeOverview,
  getPrahaBadgeDistrictCodes,
} from "./badges.ts";
import { prisma } from "../prisma.ts";

export const SCORE_EVENT_TYPE = {
  districtClaim: "DISTRICT_CLAIM",
  chapterComplete: "CHAPTER_COMPLETE",
  prahaPartComplete: "PRAHA_PART_COMPLETE",
} as const satisfies Record<string, ScoreEventType>;

export const SCORE_POINT_VALUES = {
  chapterComplete: 750,
  prahaPartComplete: 300,
} as const;

const MANAGED_SCORE_EVENT_TYPES: ScoreEventType[] = [
  SCORE_EVENT_TYPE.districtClaim,
  SCORE_EVENT_TYPE.chapterComplete,
  SCORE_EVENT_TYPE.prahaPartComplete,
];

type ScoreDbClient = Pick<PrismaClient, "districtClaim" | "scoreEvent">
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

function maxDate(values: Date[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce(
    (latest, value) => (value.getTime() > latest.getTime() ? value : latest),
    values[0],
  );
}

function buildManagedScoreEventsForClaims(
  userId: string,
  claims: ScoreClaimSnapshot[],
): Prisma.ScoreEventUncheckedCreateInput[] {
  if (claims.length === 0) {
    return [];
  }

  const claimByDistrict = new Map(
    claims.map((claim) => [claim.districtCode.toUpperCase(), claim] as const),
  );
  const completedCodes = new Set([...claimByDistrict.keys()]);
  const badges = buildBadgeOverview(completedCodes);

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

  return [...claimEvents, ...chapterEvents, ...prahaEvents];
}

type SyncScoreEventsInput = {
  db: ScoreDbClient;
  userId: string;
  claims?: ScoreClaimSnapshot[];
};

export async function syncUserScoreEvents(input: SyncScoreEventsInput) {
  const claims = input.claims
    ?? await input.db.districtClaim.findMany({
      where: { userId: input.userId },
      select: {
        districtCode: true,
        chapterSlug: true,
        awardedPoints: true,
        claimedAt: true,
      },
    });

  const nextEvents = buildManagedScoreEventsForClaims(input.userId, claims);
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
