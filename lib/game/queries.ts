import { unstable_cache } from "next/cache";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import { buildBadgeOverview, type BadgeOverview } from "@/lib/game/badges";
import { buildOverview, countClaimsToday } from "@/lib/game/progress";
import { getUserScoreTotal } from "@/lib/game/score-ledger";
import { prisma } from "@/lib/prisma";

export type LeaderboardEntry = {
  userId: string;
  nickname: string | null;
  name: string | null;
  email: string | null;
  avatar: string | null;
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
const LEADERBOARD_SEARCH_MAX_LENGTH = 64;

const LEADERBOARD_CACHE_CONFIG = {
  revalidate: LEADERBOARD_CACHE_SECONDS,
  tags: [LEADERBOARD_CACHE_TAG],
};

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

type UserBadgeContextSnapshot = {
  teamId: string | null;
  hasJoinedTeam: boolean;
  hasBeenTeamLeader: boolean;
  ledTeam: { id: string } | null;
};

function toBadgeContext(user: UserBadgeContextSnapshot | null) {
  return {
    joinedTeam: Boolean(user?.hasJoinedTeam || user?.teamId),
    hasBeenTeamLeader: Boolean(user?.hasBeenTeamLeader || user?.ledTeam),
  };
}

export async function getUserBadgeOverview(userId: string) {
  const [claims, user] = await Promise.all([
    getUserGameClaims(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        teamId: true,
        hasJoinedTeam: true,
        hasBeenTeamLeader: true,
        ledTeam: {
          select: { id: true },
        },
      },
    }),
  ]);

  return buildBadgeOverview(
    new Set(claims.map((claim) => claim.districtCode)),
    {
      claimDates: claims.map((claim) => claim.claimedAt),
      ...toBadgeContext(user),
    },
  );
}

const LEADERBOARD_RANKING_CTE = Prisma.sql`
  WITH active_users AS (
    SELECT DISTINCT dc."userId"
    FROM "DistrictClaim" dc
    UNION
    SELECT DISTINCT se."userId"
    FROM "ScoreEvent" se
  ),
  score_totals AS (
    SELECT
      se."userId",
      COALESCE(SUM(se."points"), 0)::int AS points
    FROM "ScoreEvent" se
    GROUP BY se."userId"
  ),
  claim_totals AS (
    SELECT
      dc."userId" AS "userId",
      COUNT(*)::int AS completed
    FROM "DistrictClaim" dc
    GROUP BY dc."userId"
  ),
  user_stats AS (
    SELECT
      au."userId" AS "userId",
      COALESCE(st.points, 0)::int AS points,
      COALESCE(ct.completed, 0)::int AS completed
    FROM active_users au
    LEFT JOIN score_totals st ON st."userId" = au."userId"
    LEFT JOIN claim_totals ct ON ct."userId" = au."userId"
  ),
  ranked AS (
    SELECT
      us."userId",
      us.points,
      us.completed,
      RANK() OVER (ORDER BY us.points DESC, us.completed DESC)::int AS rank
    FROM user_stats us
  )
`;

function normalizeLeaderboardSearchQuery(searchQuery?: string) {
  return searchQuery?.trim().slice(0, LEADERBOARD_SEARCH_MAX_LENGTH) ?? "";
}

function buildLeaderboardSearchCondition(searchQuery: string) {
  if (!searchQuery) {
    return Prisma.empty;
  }

  const pattern = `%${searchQuery}%`;
  return Prisma.sql`
    WHERE (
      COALESCE(u.nickname, '') ILIKE ${pattern}
      OR COALESCE(u.name, '') ILIKE ${pattern}
      OR COALESCE(u.email, '') ILIKE ${pattern}
    )
  `;
}

type LeaderboardTotalRow = {
  totalPlayers: number;
};

async function fetchLeaderboardFilteredTotalPlayers(searchQuery: string) {
  const whereClause = buildLeaderboardSearchCondition(searchQuery);
  const rows = await prisma.$queryRaw<LeaderboardTotalRow[]>(Prisma.sql`
    ${LEADERBOARD_RANKING_CTE}
    SELECT COUNT(*)::int AS "totalPlayers"
    FROM ranked r
    INNER JOIN "User" u ON u.id = r."userId"
    ${whereClause}
  `);

  return rows[0]?.totalPlayers ?? 0;
}

async function fetchLeaderboardEntriesPage(
  page: number,
  pageSize: number,
  searchQuery: string,
): Promise<LeaderboardEntry[]> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const offset = (safePage - 1) * safePageSize;
  const whereClause = buildLeaderboardSearchCondition(searchQuery);

  return prisma.$queryRaw<LeaderboardEntry[]>(Prisma.sql`
    ${LEADERBOARD_RANKING_CTE}
    SELECT
      r."userId" AS "userId",
      u.nickname,
      u.name,
      u.email,
      u.avatar,
      r.points,
      r.completed,
      r.rank
    FROM ranked r
    INNER JOIN "User" u ON u.id = r."userId"
    ${whereClause}
    ORDER BY r.rank ASC, r."userId" ASC
    LIMIT ${safePageSize}
    OFFSET ${offset}
  `);
}

async function fetchLeaderboardEntryByUserId(userId: string): Promise<LeaderboardEntry | null> {
  const rows = await prisma.$queryRaw<LeaderboardEntry[]>(Prisma.sql`
    ${LEADERBOARD_RANKING_CTE}
    SELECT
      r."userId" AS "userId",
      u.nickname,
      u.name,
      u.email,
      u.avatar,
      r.points,
      r.completed,
      r.rank
    FROM ranked r
    INNER JOIN "User" u ON u.id = r."userId"
    WHERE r."userId" = ${userId}
    LIMIT 1
  `);

  return rows[0] ?? null;
}

const getCachedLeaderboardFilteredTotalPlayers = unstable_cache(
  async (searchQuery: string) => fetchLeaderboardFilteredTotalPlayers(searchQuery),
  ["leaderboard-filtered-total-v1"],
  LEADERBOARD_CACHE_CONFIG,
);

const getCachedLeaderboardEntriesPage = unstable_cache(
  async (page: number, pageSize: number, searchQuery: string) =>
    fetchLeaderboardEntriesPage(page, pageSize, searchQuery),
  ["leaderboard-page-v1"],
  LEADERBOARD_CACHE_CONFIG,
);

const getCachedLeaderboardEntryByUserId = unstable_cache(
  async (userId: string) => fetchLeaderboardEntryByUserId(userId),
  ["leaderboard-entry-by-user-v1"],
  LEADERBOARD_CACHE_CONFIG,
);

export async function getUserPointsRanking(userId: string) {
  const [totalPlayers, entry] = await Promise.all([
    getCachedLeaderboardFilteredTotalPlayers(""),
    getCachedLeaderboardEntryByUserId(userId),
  ]);

  return {
    rank: entry?.rank ?? null,
    totalPlayers,
    userPoints: entry?.points ?? 0,
  };
}

export async function getPointsLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const safeLimit = Math.max(1, limit);
  return getCachedLeaderboardEntriesPage(1, safeLimit, "");
}

export async function getPointsLeaderboardPreview(
  userId: string,
  limit = 15,
): Promise<LeaderboardPreview> {
  const safeLimit = Math.max(1, limit);
  const [topEntries, myEntry, totalPlayers] = await Promise.all([
    getCachedLeaderboardEntriesPage(1, safeLimit, ""),
    getCachedLeaderboardEntryByUserId(userId),
    getCachedLeaderboardFilteredTotalPlayers(""),
  ]);

  return {
    topEntries,
    myEntry,
    totalPlayers,
    showMyEntrySeparately: Boolean(myEntry && myEntry.rank > safeLimit),
  };
}

export async function getPointsLeaderboardPage(
  page = 1,
  pageSize = 50,
  searchQuery?: string,
): Promise<LeaderboardPageResult> {
  const normalizedSearchQuery = normalizeLeaderboardSearchQuery(searchQuery);
  const safePageSize = Math.max(1, pageSize);
  const totalPlayers = await getCachedLeaderboardFilteredTotalPlayers(normalizedSearchQuery);
  const totalPages = Math.max(1, Math.ceil(totalPlayers / safePageSize));
  const safePage = Math.min(totalPages, Math.max(1, page));
  const entries =
    totalPlayers > 0
      ? await getCachedLeaderboardEntriesPage(
          safePage,
          safePageSize,
          normalizedSearchQuery,
        )
      : [];

  return {
    entries,
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
      teamId: true,
      hasJoinedTeam: true,
      hasBeenTeamLeader: true,
      ledTeam: {
        select: { id: true },
      },
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

  const [claims, points] = await Promise.all([
    getUserGameClaims(user.id),
    getUserScoreTotal(user.id),
  ]);
  const overview = buildOverview(claims);
  const badges = buildBadgeOverview(overview.completedCodes, {
    claimDates: claims.map((claim) => claim.claimedAt),
    ...toBadgeContext(user),
  });

  return {
    userId: user.id,
    nickname: user.nickname,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    teamName: user.team?.name ?? null,
    teamSlug: user.team?.slug ?? null,
    points,
    completed: overview.totalCompleted,
    totalDistricts: overview.totalDistricts,
    completionPercent: overview.completionPercent,
    badges,
  };
}

const getUserNavStatsCached = cache(async (userId: string): Promise<UserNavStats> => {
  const [claims, ranking, points, user] = await Promise.all([
    getUserGameClaims(userId),
    getUserPointsRanking(userId),
    getUserScoreTotal(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        teamId: true,
        hasJoinedTeam: true,
        hasBeenTeamLeader: true,
        ledTeam: {
          select: { id: true },
        },
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
  const badges = buildBadgeOverview(overview.completedCodes, {
    claimDates: claims.map((claim) => claim.claimedAt),
    ...toBadgeContext(user),
  });
  const claimsTodayCount = countClaimsToday(claims.map((claim) => claim.claimedAt));
  const streakMessage = claimsTodayCount > 0
    ? overview.currentStreak <= 1
      ? "Dnes jsi začal."
      : `Máte ${overview.currentStreak} dní v řadě.`
    : "Začni dnes.";

  return {
    points,
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
