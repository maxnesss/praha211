import type { Prisma } from "@prisma/client";
import { getPublicPlayerName } from "@/lib/team-utils";

type TeamVoteTx = Prisma.TransactionClient;

type TeamMemberSnapshot = {
  id: string;
  createdAt: Date;
  nickname: string | null;
  name: string | null;
  email: string | null;
};

function sortMembersBySeniority(a: TeamMemberSnapshot, b: TeamMemberSnapshot) {
  const byCreatedAt = a.createdAt.getTime() - b.createdAt.getTime();
  if (byCreatedAt !== 0) {
    return byCreatedAt;
  }

  return a.id.localeCompare(b.id);
}

function pickLeaderByVotes(input: {
  members: TeamMemberSnapshot[];
  currentLeaderUserId: string;
  voteCounts: Map<string, number>;
}) {
  if (input.members.length === 0) {
    return null;
  }

  let maxVotes = -1;
  const candidates: TeamMemberSnapshot[] = [];

  for (const member of input.members) {
    const votes = input.voteCounts.get(member.id) ?? 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      candidates.length = 0;
      candidates.push(member);
      continue;
    }

    if (votes === maxVotes) {
      candidates.push(member);
    }
  }

  if (candidates.length === 0) {
    return [...input.members].sort(sortMembersBySeniority)[0] ?? null;
  }

  const currentLeaderCandidate = candidates.find(
    (candidate) => candidate.id === input.currentLeaderUserId,
  );
  if (currentLeaderCandidate) {
    return currentLeaderCandidate;
  }

  return [...candidates].sort(sortMembersBySeniority)[0] ?? null;
}

export async function synchronizeTeamLeaderByVotes(tx: TeamVoteTx, teamId: string) {
  const team = await tx.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      leaderUserId: true,
      users: {
        select: {
          id: true,
          createdAt: true,
          nickname: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error("TEAM_NOT_FOUND");
  }

  if (team.users.length === 0) {
    return {
      teamId: team.id,
      membersCount: 0,
      leaderUserId: team.leaderUserId,
      leaderDisplayName: null,
      changed: false,
    };
  }

  const members = [...team.users].sort(sortMembersBySeniority);
  const memberIds = members.map((member) => member.id);
  const memberIdSet = new Set(memberIds);

  await tx.teamLeaderVote.deleteMany({
    where: {
      teamId: team.id,
      OR: [
        { userId: { notIn: memberIds } },
        { candidateUserId: { notIn: memberIds } },
      ],
    },
  });

  const existingVotes = await tx.teamLeaderVote.findMany({
    where: {
      teamId: team.id,
      userId: { in: memberIds },
    },
    select: {
      userId: true,
    },
  });
  const existingVoterIds = new Set(existingVotes.map((vote) => vote.userId));
  const defaultCandidateUserId = memberIdSet.has(team.leaderUserId)
    ? team.leaderUserId
    : members[0]?.id;

  if (!defaultCandidateUserId) {
    return {
      teamId: team.id,
      membersCount: members.length,
      leaderUserId: team.leaderUserId,
      leaderDisplayName: null,
      changed: false,
    };
  }

  const missingVotes = memberIds
    .filter((memberId) => !existingVoterIds.has(memberId))
    .map((memberId) => ({
      teamId: team.id,
      userId: memberId,
      candidateUserId: defaultCandidateUserId,
    }));

  if (missingVotes.length > 0) {
    await tx.teamLeaderVote.createMany({
      data: missingVotes,
      skipDuplicates: true,
    });
  }

  const votes = await tx.teamLeaderVote.findMany({
    where: {
      teamId: team.id,
      userId: { in: memberIds },
      candidateUserId: { in: memberIds },
    },
    select: {
      candidateUserId: true,
    },
  });

  const voteCounts = new Map<string, number>();
  for (const member of members) {
    voteCounts.set(member.id, 0);
  }
  for (const vote of votes) {
    voteCounts.set(vote.candidateUserId, (voteCounts.get(vote.candidateUserId) ?? 0) + 1);
  }

  const nextLeader = pickLeaderByVotes({
    members,
    currentLeaderUserId: team.leaderUserId,
    voteCounts,
  });

  if (!nextLeader) {
    return {
      teamId: team.id,
      membersCount: members.length,
      leaderUserId: team.leaderUserId,
      leaderDisplayName: null,
      changed: false,
    };
  }

  const changed = team.leaderUserId !== nextLeader.id;
  if (changed) {
    await tx.team.update({
      where: { id: team.id },
      data: { leaderUserId: nextLeader.id },
      select: { id: true },
    });
  }

  await tx.user.update({
    where: { id: nextLeader.id },
    data: { hasBeenTeamLeader: true },
    select: { id: true },
  });

  return {
    teamId: team.id,
    membersCount: members.length,
    leaderUserId: nextLeader.id,
    leaderDisplayName: getPublicPlayerName(nextLeader),
    changed,
  };
}
