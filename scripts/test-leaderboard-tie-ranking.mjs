#!/usr/bin/env node

import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildNamespace() {
  return `leaderboard-rank-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

async function createUser(namespace, label) {
  return prisma.user.create({
    data: {
      email: `${namespace}.${label}@tests.praha112.local`,
      name: `Leaderboard ${label}`,
      avatar: "male/dobrodruh",
      role: "USER",
    },
    select: { id: true, email: true },
  });
}

async function createClaim(userId, districtCode, points, claimedAt) {
  return prisma.districtClaim.create({
    data: {
      userId,
      districtCode,
      chapterSlug: "test",
      districtName: `Test ${districtCode}`,
      selfieUrl: `https://praha112.local/tests/${districtCode}`,
      signVisible: true,
      claimedAt,
      basePoints: points,
      sameDayMultiplier: 1,
      streakBonus: 0,
      awardedPoints: points,
    },
    select: { id: true },
  });
}

async function fetchFixtureRanks(userIds) {
  return prisma.$queryRaw`
    WITH fixture_claims AS (
      SELECT dc."userId", dc."awardedPoints"
      FROM "DistrictClaim" dc
      WHERE dc."userId" IN (${Prisma.join(userIds)})
    ),
    user_stats AS (
      SELECT
        fc."userId",
        COALESCE(SUM(fc."awardedPoints"), 0)::int AS points,
        COUNT(*)::int AS completed
      FROM fixture_claims fc
      GROUP BY fc."userId"
    ),
    ranked AS (
      SELECT
        us."userId",
        us.points,
        us.completed,
        RANK() OVER (ORDER BY us.points DESC, us.completed DESC)::int AS rank
      FROM user_stats us
    )
    SELECT
      r."userId" AS "userId",
      r.points,
      r.completed,
      r.rank
    FROM ranked r
    ORDER BY r.rank ASC, r."userId" ASC
  `;
}

async function cleanupFixtures(claimIds, userIds) {
  if (claimIds.length > 0) {
    await prisma.districtClaim.deleteMany({
      where: { id: { in: claimIds } },
    });
  }

  if (userIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }
}

async function main() {
  const namespace = buildNamespace();
  const createdUserIds = [];
  const createdClaimIds = [];

  try {
    const [alpha, beta, gamma, delta] = await Promise.all([
      createUser(namespace, "alpha"),
      createUser(namespace, "beta"),
      createUser(namespace, "gamma"),
      createUser(namespace, "delta"),
    ]);

    createdUserIds.push(alpha.id, beta.id, gamma.id, delta.id);

    const now = Date.now();
    const claims = await Promise.all([
      createClaim(alpha.id, `${namespace}-a-1`, 60, new Date(now - 4_000)),
      createClaim(alpha.id, `${namespace}-a-2`, 40, new Date(now - 3_500)),
      createClaim(beta.id, `${namespace}-b-1`, 100, new Date(now - 3_000)),
      createClaim(delta.id, `${namespace}-d-1`, 100, new Date(now - 2_500)),
      createClaim(gamma.id, `${namespace}-g-1`, 50, new Date(now - 2_000)),
    ]);

    createdClaimIds.push(...claims.map((claim) => claim.id));

    const rows = await fetchFixtureRanks(createdUserIds);
    const byId = new Map(rows.map((row) => [row.userId, row]));

    const alphaRow = byId.get(alpha.id);
    const betaRow = byId.get(beta.id);
    const deltaRow = byId.get(delta.id);
    const gammaRow = byId.get(gamma.id);

    assert(alphaRow, "Missing alpha row in ranking output.");
    assert(betaRow, "Missing beta row in ranking output.");
    assert(deltaRow, "Missing delta row in ranking output.");
    assert(gammaRow, "Missing gamma row in ranking output.");

    assert(alphaRow.points === 100, "Alpha should have 100 points.");
    assert(alphaRow.completed === 2, "Alpha should have 2 completed districts.");
    assert(alphaRow.rank === 1, "Alpha should rank #1 (same points, more completed).");

    assert(betaRow.points === 100, "Beta should have 100 points.");
    assert(betaRow.completed === 1, "Beta should have 1 completed district.");
    assert(betaRow.rank === 2, "Beta should rank #2.");

    assert(deltaRow.points === 100, "Delta should have 100 points.");
    assert(deltaRow.completed === 1, "Delta should have 1 completed district.");
    assert(deltaRow.rank === 2, "Delta should share rank #2 with Beta.");

    assert(gammaRow.points === 50, "Gamma should have 50 points.");
    assert(gammaRow.completed === 1, "Gamma should have 1 completed district.");
    assert(gammaRow.rank === 4, "Gamma should rank #4 after a shared #2 tie.");

    console.log("PASS test-leaderboard-tie-ranking");
  } finally {
    await cleanupFixtures(createdClaimIds, createdUserIds);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("FAIL test-leaderboard-tie-ranking");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
