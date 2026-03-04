import type { Prisma } from "@prisma/client";
import { buildBadgeOverview } from "@/lib/game/badges";
import {
  calculateAwardedPoints,
  calculateCurrentStreak,
  countClaimsToday,
} from "@/lib/game/progress";
import { createMessagesForRecipients } from "@/lib/messaging";
import { syncUserScoreEvents } from "@/lib/game/score-ledger";

type CreateApprovedClaimInput = {
  tx: Prisma.TransactionClient;
  userId: string;
  districtCode: string;
  chapterSlug: string;
  districtName: string;
  selfieUrl: string;
  signVisible: boolean;
  claimedAt: Date;
  basePoints: number;
};

export type ApprovedClaimResult = {
  claim: {
    id: string;
    districtCode: string;
    districtName: string;
    chapterSlug: string;
    claimedAt: Date;
    selfieUrl: string;
  };
  streakAfterClaim: number;
};

export async function createApprovedDistrictClaim(
  input: CreateApprovedClaimInput,
): Promise<ApprovedClaimResult> {
  const [historicalClaims, claimsBefore, userBadgeContext] = await Promise.all([
    input.tx.districtClaim.findMany({
      where: {
        userId: input.userId,
        claimedAt: { lte: input.claimedAt },
      },
      select: { claimedAt: true },
      orderBy: { claimedAt: "desc" },
    }),
    input.tx.districtClaim.findMany({
      where: {
        userId: input.userId,
      },
      select: {
        districtCode: true,
        claimedAt: true,
      },
    }),
    input.tx.user.findUnique({
      where: { id: input.userId },
      select: {
        teamId: true,
        hasJoinedTeam: true,
        hasBeenTeamLeader: true,
      },
    }),
  ]);

  const claimDates = historicalClaims.map((claim) => claim.claimedAt);
  const claimsTodayBefore = countClaimsToday(claimDates, input.claimedAt);
  const streakAfterClaim = calculateCurrentStreak([...claimDates, input.claimedAt], input.claimedAt);
  const scoring = calculateAwardedPoints({
    basePoints: input.basePoints,
    claimsTodayBefore,
    streakAfterClaim,
  });

  const claim = await input.tx.districtClaim.create({
    data: {
      userId: input.userId,
      districtCode: input.districtCode,
      chapterSlug: input.chapterSlug,
      districtName: input.districtName,
      selfieUrl: input.selfieUrl,
      signVisible: input.signVisible,
      claimedAt: input.claimedAt,
      basePoints: input.basePoints,
      sameDayMultiplier: scoring.sameDayMultiplier,
      streakBonus: scoring.streakBonus,
      awardedPoints: scoring.awardedPoints,
    },
    select: {
      id: true,
      districtCode: true,
      districtName: true,
      chapterSlug: true,
      claimedAt: true,
      selfieUrl: true,
    },
  });

  const badgeContext = {
    joinedTeam: Boolean(userBadgeContext?.hasJoinedTeam || userBadgeContext?.teamId),
    hasBeenTeamLeader: Boolean(userBadgeContext?.hasBeenTeamLeader),
  };
  const unlockedAchievementIdsBefore = new Set(
    buildBadgeOverview(
      new Set(claimsBefore.map((existingClaim) => existingClaim.districtCode)),
      {
        claimDates: claimsBefore.map((existingClaim) => existingClaim.claimedAt),
        ...badgeContext,
      },
    ).achievementBadges
      .filter((badge) => badge.unlocked)
      .map((badge) => badge.id),
  );

  await syncUserScoreEvents({
    db: input.tx,
    userId: input.userId,
  });

  const badgesAfter = buildBadgeOverview(
    new Set([...claimsBefore.map((existingClaim) => existingClaim.districtCode), input.districtCode]),
    {
      claimDates: [...claimsBefore.map((existingClaim) => existingClaim.claimedAt), input.claimedAt],
      ...badgeContext,
    },
  );

  const newlyUnlockedBadges = badgesAfter.achievementBadges.filter(
    (badge) => badge.unlocked && !unlockedAchievementIdsBefore.has(badge.id),
  );

  for (const badge of newlyUnlockedBadges) {
    await createMessagesForRecipients({
      db: input.tx,
      recipientUserIds: [input.userId],
      senderUserId: null,
      category: "BADGE_UNLOCK",
      title: `Nový odznak: ${badge.title}`,
      body: `Právě jste získali odznak „${badge.title}“ (${badge.subtitle}). Pokračujte dál, další výzvy čekají.`,
      dedupeKey: `badge_unlock:${badge.id}`,
    });
  }

  return {
    claim,
    streakAfterClaim,
  };
}
