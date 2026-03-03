import type { Prisma } from "@prisma/client";
import {
  calculateAwardedPoints,
  calculateCurrentStreak,
  countClaimsToday,
} from "@/lib/game/progress";
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
  const historicalClaims = await input.tx.districtClaim.findMany({
    where: {
      userId: input.userId,
      claimedAt: { lte: input.claimedAt },
    },
    select: { claimedAt: true },
    orderBy: { claimedAt: "desc" },
  });

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

  await syncUserScoreEvents({
    db: input.tx,
    userId: input.userId,
  });

  return {
    claim,
    streakAfterClaim,
  };
}
