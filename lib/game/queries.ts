import { unstable_cache } from "next/cache";
import { cache } from "react";
import { buildBadgeOverview, type BadgeOverview } from "@/lib/game/badges";
import { buildOverview, countClaimsToday } from "@/lib/game/progress";
import { prisma } from "@/lib/prisma";

export type LeaderboardEntry = {
  userId: string;
  nickname: string | null;
  name: string | null;
  email: string | null;
  points: number;
  completed: number;
  rank: number;
};

export type LeaderboardPreview = {
  topEntries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  totalPlayers: number;
  showMyEntrySeparately: boolean;
};

export type LeaderboardPageResult = {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  totalPages: number;
  page: number;
  pageSize: number;
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

export type PublicPlayerProfile = {
  userId: string;
  nickname: string | null;
  name: string | null;
  email: string | null;
  avatar: string | null;
  teamName: string | null;
  teamSlug: string | null;
  points: number;
  completed: number;
  totalDistricts: number;
  completionPercent: number;
  badges: BadgeOverview;
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
      nickname: true,
      name: true,
      email: true,
    },
  });

  const usersById = new Map(users.map((user) => [user.id, user] as const));
  const leaderboard: LeaderboardEntry[] = [];
  let currentRank = 0;
  let previousPoints: number | null = null;
  let previousCompleted: number | null = null;

  for (let index = 0; index < byPoints.length; index += 1) {
    const entry = byPoints[index];
    const points = entry._sum.awardedPoints ?? 0;
    const completed = entry._count._all ?? 0;

    if (
      previousPoints === null
      || previousCompleted === null
      || points < previousPoints
      || completed < previousCompleted
    ) {
      currentRank = index + 1;
    }

    previousPoints = points;
    previousCompleted = completed;
    const user = usersById.get(entry.userId);

    leaderboard.push({
      userId: entry.userId,
      nickname: user?.nickname ?? null,
      name: user?.name ?? null,
      email: user?.email ?? null,
      points,
      completed,
      rank: currentRank,
    });
  }

  return leaderboard;
}

const getCachedLeaderboardSnapshot = unstable_cache(
  async () => buildLeaderboardSnapshot(),
  ["leaderboard-snapshot-v3"],
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

export async function getPointsLeaderboardPreview(
  userId: string,
  limit = 15,
): Promise<LeaderboardPreview> {
  const leaderboard = await getCachedLeaderboardSnapshot();
  const safeLimit = Math.max(1, limit);
  const topEntries = leaderboard.slice(0, safeLimit);
  const myEntry = leaderboard.find((entry) => entry.userId === userId) ?? null;

  return {
    topEntries,
    myEntry,
    totalPlayers: leaderboard.length,
    showMyEntrySeparately: Boolean(myEntry && myEntry.rank > safeLimit),
  };
}

export async function getPointsLeaderboardPage(
  page = 1,
  pageSize = 50,
): Promise<LeaderboardPageResult> {
  const leaderboard = await getCachedLeaderboardSnapshot();
  const safePageSize = Math.max(1, pageSize);
  const totalPlayers = leaderboard.length;
  const totalPages = Math.max(1, Math.ceil(totalPlayers / safePageSize));
  const safePage = Math.min(totalPages, Math.max(1, page));
  const start = (safePage - 1) * safePageSize;

  return {
    entries: leaderboard.slice(start, start + safePageSize),
    totalPlayers,
    totalPages,
    page: safePage,
    pageSize: safePageSize,
  };
}

export async function getPublicPlayerProfile(userId: string): Promise<PublicPlayerProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nickname: true,
      name: true,
      email: true,
      avatar: true,
      team: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const claims = await getUserGameClaims(user.id);
  const overview = buildOverview(claims);
  const badges = buildBadgeOverview(overview.completedCodes);

  return {
    userId: user.id,
    nickname: user.nickname,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    teamName: user.team?.name ?? null,
    teamSlug: user.team?.slug ?? null,
    points: overview.totalPoints,
    completed: overview.totalCompleted,
    totalDistricts: overview.totalDistricts,
    completionPercent: overview.completionPercent,
    badges,
  };
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
