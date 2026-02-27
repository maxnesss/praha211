import { prisma } from "@/lib/prisma";
import type { TeamDetail, TeamDirectoryItem } from "@/lib/team-types";
import { getPublicPlayerName, TEAM_MAX_MEMBERS } from "@/lib/team-utils";

type ClaimAggregate = {
  points: number;
  completed: number;
};

async function getClaimAggregateByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, ClaimAggregate>();
  }

  const grouped = await prisma.districtClaim.groupBy({
    by: ["userId"],
    where: { userId: { in: userIds } },
    _sum: { awardedPoints: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((entry) => [
      entry.userId,
      {
        points: entry._sum.awardedPoints ?? 0,
        completed: entry._count._all ?? 0,
      },
    ]),
  );
}

export async function getTeamsDirectory(): Promise<TeamDirectoryItem[]> {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      leaderUserId: true,
      leader: {
        select: {
          name: true,
          nickname: true,
          email: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
        },
      },
    },
  });

  const userIds = teams.flatMap((team) => team.users.map((user) => user.id));
  const claimByUserId = await getClaimAggregateByUserIds(userIds);

  return teams
    .map((team) => {
      const totals = team.users.reduce(
        (accumulator, user) => {
          const aggregate = claimByUserId.get(user.id);
          return {
            points: accumulator.points + (aggregate?.points ?? 0),
            completed: accumulator.completed + (aggregate?.completed ?? 0),
          };
        },
        { points: 0, completed: 0 },
      );

      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        membersCount: team.users.length,
        points: totals.points,
        completed: totals.completed,
        isFull: team.users.length >= TEAM_MAX_MEMBERS,
        previewMembers: [
          `Velitel: ${getPublicPlayerName(team.leader)}`,
          ...team.users
            .filter((user) => user.id !== team.leaderUserId)
            .slice(0, TEAM_MAX_MEMBERS - 1)
            .map((user) => getPublicPlayerName(user)),
        ],
      };
    })
    .sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      if (a.membersCount !== b.membersCount) {
        return b.membersCount - a.membersCount;
      }
      return a.name.localeCompare(b.name, "cs");
    });
}

export async function getTeamDetailBySlug(
  slug: string,
  currentUserId?: string,
): Promise<TeamDetail | null> {
  const team = await prisma.team.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      leaderUserId: true,
      leader: {
        select: {
          name: true,
          nickname: true,
          email: true,
        },
      },
      joinRequests: {
        where: { status: "PENDING" },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      users: {
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!team) {
    return null;
  }

  const claimByUserId = await getClaimAggregateByUserIds(team.users.map((user) => user.id));
  const members = team.users.map((user) => {
    const aggregate = claimByUserId.get(user.id);
    return {
      id: user.id,
      displayName: getPublicPlayerName(user),
      points: aggregate?.points ?? 0,
      completed: aggregate?.completed ?? 0,
      isCurrentUser: currentUserId === user.id,
      isLeader: user.id === team.leaderUserId,
    };
  });

  const pendingRequests = team.joinRequests.map((request) => ({
    id: request.id,
    userId: request.user.id,
    displayName: getPublicPlayerName(request.user),
    createdAtIso: request.createdAt.toISOString(),
  }));

  const points = members.reduce((sum, member) => sum + member.points, 0);
  const completed = members.reduce((sum, member) => sum + member.completed, 0);

  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    leaderUserId: team.leaderUserId,
    leaderDisplayName: getPublicPlayerName(team.leader),
    points,
    completed,
    membersCount: members.length,
    isFull: members.length >= TEAM_MAX_MEMBERS,
    isCurrentUserLeader: currentUserId === team.leaderUserId,
    hasPendingRequestForCurrentUser: pendingRequests.some(
      (request) => request.userId === currentUserId,
    ),
    members,
    pendingRequests,
  };
}

export async function getCurrentUserTeam(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return user?.team ?? null;
}
