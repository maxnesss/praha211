export type TeamDirectoryItem = {
  id: string;
  name: string;
  slug: string;
  membersCount: number;
  points: number;
  completed: number;
  isFull: boolean;
  previewMembers: string[];
};

export type TeamMemberOverview = {
  id: string;
  displayName: string;
  points: number;
  completed: number;
  isCurrentUser: boolean;
  isLeader: boolean;
};

export type TeamJoinRequestOverview = {
  id: string;
  userId: string;
  displayName: string;
  createdAtIso: string;
};

export type TeamDetail = {
  id: string;
  name: string;
  slug: string;
  leaderUserId: string;
  leaderDisplayName: string;
  points: number;
  completed: number;
  membersCount: number;
  isFull: boolean;
  isCurrentUserLeader: boolean;
  hasPendingRequestForCurrentUser: boolean;
  members: TeamMemberOverview[];
  pendingRequests: TeamJoinRequestOverview[];
};
