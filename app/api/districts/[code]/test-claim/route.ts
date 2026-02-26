import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { LEADERBOARD_CACHE_TAG } from "@/lib/game/queries";
import { calculateAwardedPoints, calculateCurrentStreak, countClaimsToday } from "@/lib/game/progress";
import { getDistrictByCode } from "@/lib/game/district-catalog";
import { prisma } from "@/lib/prisma";

type TestClaimRouteContext = {
  params: Promise<{ code: string }>;
};

async function resolveAdminRequest(context: TestClaimRouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!userId) {
    return { error: NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 }) };
  }

  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { message: "Tuto testovací akci může použít pouze ADMIN." },
        { status: 403 },
      ),
    };
  }

  const { code } = await context.params;
  const district = getDistrictByCode(code);

  if (!district) {
    return {
      error: NextResponse.json(
        { message: "Městská část nebyla nalezena." },
        { status: 404 },
      ),
    };
  }

  return { userId, district };
}

export async function POST(_request: Request, context: TestClaimRouteContext) {
  const resolved = await resolveAdminRequest(context);
  if ("error" in resolved) {
    return resolved.error;
  }

  const { userId, district } = resolved;

  const existingClaim = await prisma.districtClaim.findUnique({
    where: {
      userId_districtCode: {
        userId,
        districtCode: district.code,
      },
    },
    select: { id: true },
  });

  if (existingClaim) {
    return NextResponse.json(
      { message: "Městská část už je odemčena." },
      { status: 409 },
    );
  }

  const historicalClaims = await prisma.districtClaim.findMany({
    where: { userId },
    select: { claimedAt: true },
    orderBy: { claimedAt: "desc" },
  });

  const now = new Date();
  const claimDates = historicalClaims.map((claim) => claim.claimedAt);
  const claimsTodayBefore = countClaimsToday(claimDates, now);
  const streakAfterClaim = calculateCurrentStreak([...claimDates, now], now);
  const scoring = calculateAwardedPoints({
    basePoints: district.basePoints,
    claimsTodayBefore,
    streakAfterClaim,
  });

  await prisma.districtClaim.create({
    data: {
      userId,
      districtCode: district.code,
      chapterSlug: district.chapterSlug,
      districtName: district.name,
      selfieUrl: `https://praha112.local/admin-test/${district.code.toLowerCase()}`,
      signVisible: true,
      claimedAt: now,
      basePoints: district.basePoints,
      sameDayMultiplier: scoring.sameDayMultiplier,
      streakBonus: scoring.streakBonus,
      awardedPoints: scoring.awardedPoints,
    },
  });

  revalidateTag(LEADERBOARD_CACHE_TAG, "max");

  return NextResponse.json(
    {
      message: `Test: ${district.name} odemčena (+${scoring.awardedPoints} bodů).`,
      awardedPoints: scoring.awardedPoints,
    },
    { status: 201 },
  );
}

export async function DELETE(_request: Request, context: TestClaimRouteContext) {
  const resolved = await resolveAdminRequest(context);
  if ("error" in resolved) {
    return resolved.error;
  }

  const { userId, district } = resolved;

  const existingClaim = await prisma.districtClaim.findUnique({
    where: {
      userId_districtCode: {
        userId,
        districtCode: district.code,
      },
    },
    select: { id: true },
  });

  if (!existingClaim) {
    return NextResponse.json(
      { message: "Městská část je už zamčena." },
      { status: 404 },
    );
  }

  await prisma.districtClaim.delete({
    where: {
      userId_districtCode: {
        userId,
        districtCode: district.code,
      },
    },
  });

  revalidateTag(LEADERBOARD_CACHE_TAG, "max");

  return NextResponse.json({
    message: `Test: ${district.name} zamčena a body odečteny.`,
  });
}
