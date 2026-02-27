import { unstable_cache } from "next/cache";
import { cache } from "react";
import { buildBadgeOverview } from "@/lib/game/badges";
import { buildOverview, countClaimsToday } from "@/lib/game/progress";
import { prisma } from "@/lib/prisma";

export type LeaderboardEntry = {
  userId: string;
  name: string | null;
  email: string | null;
  points: number;
  completed: number;
  rank: number;
};

export type UserNavStats = {
  points: number;
  completion: string;
  ranking: string;
  dayStreak: string;
  badgesCount: number;
  teamName: string;
  teamSlug: string | null;
};

export const LEADERBOARD_CACHE_TAG = "leaderboard";
const LEADERBOARD_CACHE_SECONDS = 60;

const getUserGameClaimsCached = cache(async (userId: string) => {
  return prisma.districtClaim.findMany({
    where: { userId },
    select: {
      districtCode: true,
      awardedPoints: true,
      claimedAt: true,
    },
    orderBy: { claimedAt: "desc" },
  });
});

export async function getUserGameClaims(userId: string) {
  return getUserGameClaimsCached(userId);
}

export async function getUserClaimedDistrictCodes(userId: string) {
  const claims = await getUserGameClaims(userId);
  return new Set(claims.map((claim) => claim.districtCode));
}

async function buildLeaderboardSnapshot(): Promise<LeaderboardEntry[]> {
  const aggregated = await prisma.districtClaim.groupBy({
    by: ["userId"],
    _sum: { awardedPoints: true },
    _count: { _all: true },
  });

  if (aggregated.length === 0) {
    return [];
  }

  const byPoints = [...aggregated].sort((a, b) => {
    const pointsA = a._sum.awardedPoints ?? 0;
    const pointsB = b._sum.awardedPoints ?? 0;

    if (pointsA !== pointsB) {
      return pointsB - pointsA;
    }

    const completedA = a._count._all ?? 0;
    const completedB = b._count._all ?? 0;
    if (completedA !== completedB) {
      return completedB - completedA;
    }

    return a.userId.localeCompare(b.userId);
  });

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: byPoints.map((entry) => entry.userId),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const usersById = new Map(users.map((user) => [user.id, user] as const));
  const leaderboard: LeaderboardEntry[] = [];
  let currentRank = 0;
  let previousPoints: number | null = null;

  for (let index = 0; index < byPoints.length; index += 1) {
    const entry = byPoints[index];
    const points = entry._sum.awardedPoints ?? 0;

    if (previousPoints === null || points < previousPoints) {
      currentRank = index + 1;
    }

    previousPoints = points;
    const user = usersById.get(entry.userId);

    leaderboard.push({
      userId: entry.userId,
      name: user?.name ?? null,
      email: user?.email ?? null,
      points,
      completed: entry._count._all ?? 0,
      rank: currentRank,
    });
  }

  return leaderboard;
}

const getCachedLeaderboardSnapshot = unstable_cache(
  async () => buildLeaderboardSnapshot(),
  ["leaderboard-snapshot-v2"],
  {
    revalidate: LEADERBOARD_CACHE_SECONDS,
    tags: [LEADERBOARD_CACHE_TAG],
  },
);

export async function getUserPointsRanking(userId: string) {
  const leaderboard = await getCachedLeaderboardSnapshot();
  const totalPlayers = leaderboard.length;
  const entry = leaderboard.find((item) => item.userId === userId);

  return {
    rank: entry?.rank ?? null,
    totalPlayers,
    userPoints: entry?.points ?? 0,
  };
}

export async function getPointsLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const leaderboard = await getCachedLeaderboardSnapshot();
  return leaderboard.slice(0, Math.max(1, limit));
}

const getUserNavStatsCached = cache(async (userId: string): Promise<UserNavStats> => {
  const [claims, ranking, user] = await Promise.all([
    getUserGameClaims(userId),
    getUserPointsRanking(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        team: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);
  const overview = buildOverview(claims);
  const badges = buildBadgeOverview(overview.completedCodes);
  const claimsTodayCount = countClaimsToday(claims.map((claim) => claim.claimedAt));
  const streakMessage = claimsTodayCount > 0
    ? overview.currentStreak <= 1
      ? "Dnes jsi začal."
      : `Máte ${overview.currentStreak} dní v řadě.`
    : "Začni dnes.";

  return {
    points: ranking.userPoints || overview.totalPoints,
    completion: `${overview.totalCompleted}/${overview.totalDistricts}`,
    ranking:
      ranking.rank && ranking.totalPlayers > 0
        ? `#${ranking.rank}/${ranking.totalPlayers}`
        : "Bez pořadí",
    dayStreak: streakMessage,
    badgesCount: badges.totals.unlocked,
    teamName: user?.team?.name ?? "Bez týmu",
    teamSlug: user?.team?.slug ?? null,
  };
});

export async function getUserNavStats(userId: string): Promise<UserNavStats> {
  return getUserNavStatsCached(userId);
}
