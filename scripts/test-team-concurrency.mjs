#!/usr/bin/env node

import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TEAM_MAX_MEMBERS = 5;
const SERIALIZABLE_MAX_ATTEMPTS = 4;
const SERIALIZABLE_BASE_DELAY_MS = 30;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSerializableWithRetry(callback) {
  for (let attempt = 1; attempt <= SERIALIZABLE_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const isSerializationConflict =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!isSerializationConflict || attempt >= SERIALIZABLE_MAX_ATTEMPTS) {
        throw error;
      }

      const jitterMs = Math.floor(Math.random() * 25);
      await sleep(SERIALIZABLE_BASE_DELAY_MS * attempt + jitterMs);
    }
  }

  throw new Error("SERIALIZABLE_RETRY_EXHAUSTED");
}

function buildNamespace(label) {
  return `team-concurrency-${label}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function toTeamSlug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function createFixture(namespace) {
  const createdUserIds = [];
  const createdTeamIds = [];
  const createdJoinRequestIds = [];
  let teamSlugNonce = 0;

  async function createUser(label) {
    const user = await prisma.user.create({
      data: {
        email: `${namespace}.${label}@tests.praha112.local`,
        name: `Concurrency ${label}`,
        avatar: "male/dobrodruh",
        role: "USER",
      },
      select: { id: true, email: true },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function createTeam(leaderUserId, label) {
    teamSlugNonce += 1;
    const slug = toTeamSlug(`${label}-${namespace.slice(-8)}-${teamSlugNonce}`);
    const team = await prisma.team.create({
      data: {
        name: `${label} ${namespace}`,
        slug,
        leader: { connect: { id: leaderUserId } },
        users: { connect: { id: leaderUserId } },
      },
      select: { id: true, slug: true, name: true },
    });
    createdTeamIds.push(team.id);
    return team;
  }

  async function addMemberToTeam(teamId, userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { teamId },
      select: { id: true },
    });
  }

  async function createJoinRequest(teamId, userId) {
    const request = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        userId,
        status: "PENDING",
      },
      select: { id: true, teamId: true, userId: true },
    });
    createdJoinRequestIds.push(request.id);
    return request;
  }

  async function cleanup() {
    if (createdJoinRequestIds.length > 0) {
      await prisma.teamJoinRequest.deleteMany({
        where: { id: { in: createdJoinRequestIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: createdUserIds } },
        data: { teamId: null },
      });
    }

    if (createdTeamIds.length > 0) {
      await prisma.team.deleteMany({
        where: { id: { in: createdTeamIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
  }

  return {
    createUser,
    createTeam,
    addMemberToTeam,
    createJoinRequest,
    cleanup,
  };
}

async function applyToTeam(teamSlug, userId) {
  return runSerializableWithRetry(async (tx) => {
    const [teamRecord, user] = await Promise.all([
      tx.team.findUnique({
        where: { slug: teamSlug },
        select: { id: true, leaderUserId: true },
      }),
      tx.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      }),
    ]);

    if (!teamRecord) {
      throw new Error("TEAM_NOT_FOUND");
    }
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.teamId) {
      throw new Error("ALREADY_IN_TEAM");
    }
    if (teamRecord.leaderUserId === userId) {
      throw new Error("ALREADY_LEADER");
    }

    const existing = await tx.teamJoinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId: teamRecord.id,
          userId,
        },
      },
      select: { id: true, status: true },
    });

    if (existing?.status === "PENDING") {
      throw new Error("ALREADY_APPLIED");
    }

    await tx.teamJoinRequest.upsert({
      where: {
        teamId_userId: {
          teamId: teamRecord.id,
          userId,
        },
      },
      create: {
        teamId: teamRecord.id,
        userId,
        status: "PENDING",
      },
      update: {
        status: "PENDING",
        respondedAt: null,
      },
    });
  });
}

async function approveJoinRequest(teamSlug, requestId, leaderUserId) {
  return runSerializableWithRetry(async (tx) => {
    const [team, request] = await Promise.all([
      tx.team.findUnique({
        where: { slug: teamSlug },
        select: { id: true, leaderUserId: true },
      }),
      tx.teamJoinRequest.findUnique({
        where: { id: requestId },
        select: { id: true, teamId: true, userId: true, status: true },
      }),
    ]);

    if (!team) {
      throw new Error("TEAM_NOT_FOUND");
    }
    if (team.leaderUserId !== leaderUserId) {
      throw new Error("FORBIDDEN");
    }
    if (!request || request.teamId !== team.id) {
      throw new Error("REQUEST_NOT_FOUND");
    }
    if (request.status !== "PENDING") {
      throw new Error("REQUEST_NOT_PENDING");
    }

    const applicant = await tx.user.findUnique({
      where: { id: request.userId },
      select: { teamId: true },
    });

    if (!applicant) {
      throw new Error("APPLICANT_NOT_FOUND");
    }
    if (applicant.teamId) {
      throw new Error("APPLICANT_ALREADY_IN_TEAM");
    }

    const membersCount = await tx.user.count({
      where: { teamId: team.id },
    });
    if (membersCount >= TEAM_MAX_MEMBERS) {
      throw new Error("TEAM_FULL");
    }

    const moved = await tx.user.updateMany({
      where: { id: request.userId, teamId: null },
      data: { teamId: team.id },
    });

    if (moved.count !== 1) {
      throw new Error("APPLICANT_CHANGED");
    }

    await tx.teamJoinRequest.update({
      where: { id: request.id },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    });

    await tx.teamJoinRequest.updateMany({
      where: {
        userId: request.userId,
        status: "PENDING",
        id: { not: request.id },
      },
      data: {
        status: "REJECTED",
        respondedAt: new Date(),
      },
    });
  });
}

async function testParallelApplySinglePending() {
  const fixture = createFixture(buildNamespace("apply"));
  try {
    const leader = await fixture.createUser("leader");
    const applicant = await fixture.createUser("applicant");
    const team = await fixture.createTeam(leader.id, "Apply Team");

    const results = await Promise.allSettled([
      applyToTeam(team.slug, applicant.id),
      applyToTeam(team.slug, applicant.id),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled").length;
    const rejected = results.filter((result) => result.status === "rejected").length;
    assert(fulfilled + rejected === 2, "Parallel apply: both promises must settle.");

    const totalRequests = await prisma.teamJoinRequest.count({
      where: {
        teamId: team.id,
        userId: applicant.id,
      },
    });
    const pendingRequests = await prisma.teamJoinRequest.count({
      where: {
        teamId: team.id,
        userId: applicant.id,
        status: "PENDING",
      },
    });

    assert(totalRequests === 1, "Parallel apply: expected exactly one join-request row.");
    assert(pendingRequests === 1, "Parallel apply: expected exactly one pending request.");
  } finally {
    await fixture.cleanup();
  }
}

async function testParallelApprovalsSingleSlot() {
  const fixture = createFixture(buildNamespace("single-slot"));
  try {
    const leader = await fixture.createUser("leader");
    const team = await fixture.createTeam(leader.id, "Single Slot Team");

    for (let index = 0; index < 3; index += 1) {
      const member = await fixture.createUser(`member${index + 1}`);
      await fixture.addMemberToTeam(team.id, member.id);
    }

    const applicantA = await fixture.createUser("applicantA");
    const applicantB = await fixture.createUser("applicantB");
    const requestA = await fixture.createJoinRequest(team.id, applicantA.id);
    const requestB = await fixture.createJoinRequest(team.id, applicantB.id);

    const results = await Promise.allSettled([
      approveJoinRequest(team.slug, requestA.id, leader.id),
      approveJoinRequest(team.slug, requestB.id, leader.id),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled").length;
    const rejected = results.filter((result) => result.status === "rejected").length;
    assert(fulfilled === 1, "Parallel approval with one slot: exactly one approval should succeed.");
    assert(rejected === 1, "Parallel approval with one slot: exactly one approval should fail.");

    const teamMembers = await prisma.user.findMany({
      where: {
        id: { in: [applicantA.id, applicantB.id] },
        teamId: team.id,
      },
      select: { id: true },
    });
    assert(teamMembers.length === 1, "Parallel approval with one slot: only one applicant can join.");

    const membersCount = await prisma.user.count({
      where: { teamId: team.id },
    });
    assert(
      membersCount === TEAM_MAX_MEMBERS,
      "Parallel approval with one slot: team size must be capped at 5.",
    );

    const acceptedCount = await prisma.teamJoinRequest.count({
      where: {
        id: { in: [requestA.id, requestB.id] },
        status: "ACCEPTED",
      },
    });
    assert(acceptedCount === 1, "Parallel approval with one slot: expected one accepted request.");
  } finally {
    await fixture.cleanup();
  }
}

async function testParallelApprovalsSameApplicantTwoTeams() {
  const fixture = createFixture(buildNamespace("cross-team"));
  try {
    const leaderA = await fixture.createUser("leaderA");
    const leaderB = await fixture.createUser("leaderB");
    const teamA = await fixture.createTeam(leaderA.id, "Alpha Team");
    const teamB = await fixture.createTeam(leaderB.id, "Beta Team");
    const applicant = await fixture.createUser("sharedApplicant");

    const requestA = await fixture.createJoinRequest(teamA.id, applicant.id);
    const requestB = await fixture.createJoinRequest(teamB.id, applicant.id);

    const results = await Promise.allSettled([
      approveJoinRequest(teamA.slug, requestA.id, leaderA.id),
      approveJoinRequest(teamB.slug, requestB.id, leaderB.id),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled").length;
    const rejected = results.filter((result) => result.status === "rejected").length;
    assert(
      fulfilled === 1 && rejected === 1,
      "Cross-team parallel approval: expected exactly one success and one failure.",
    );

    const updatedApplicant = await prisma.user.findUnique({
      where: { id: applicant.id },
      select: { teamId: true },
    });
    assert(
      updatedApplicant?.teamId === teamA.id || updatedApplicant?.teamId === teamB.id,
      "Cross-team parallel approval: applicant must end in exactly one team.",
    );

    const acceptedCount = await prisma.teamJoinRequest.count({
      where: {
        userId: applicant.id,
        status: "ACCEPTED",
      },
    });
    const rejectedCount = await prisma.teamJoinRequest.count({
      where: {
        userId: applicant.id,
        status: "REJECTED",
      },
    });

    assert(acceptedCount === 1, "Cross-team parallel approval: expected one accepted request.");
    assert(rejectedCount === 1, "Cross-team parallel approval: expected one rejected request.");
  } finally {
    await fixture.cleanup();
  }
}

async function main() {
  const tests = [
    {
      name: "parallel apply creates only one pending request",
      run: testParallelApplySinglePending,
    },
    {
      name: "parallel approvals with one remaining slot keep team size at 5",
      run: testParallelApprovalsSingleSlot,
    },
    {
      name: "parallel approvals for same applicant across teams allow only one membership",
      run: testParallelApprovalsSameApplicantTwoTeams,
    },
  ];

  let failures = 0;

  for (const test of tests) {
    const startedAt = Date.now();
    try {
      await test.run();
      const elapsedMs = Date.now() - startedAt;
      console.log(`PASS  ${test.name} (${elapsedMs}ms)`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL  ${test.name}`);
      console.error(error instanceof Error ? error.stack ?? error.message : error);
    }
  }

  if (failures > 0) {
    throw new Error(`Team concurrency suite failed (${failures}/${tests.length} failed).`);
  }

  console.log(`OK    Team concurrency suite passed (${tests.length} tests).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
