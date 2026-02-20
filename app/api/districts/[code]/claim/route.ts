import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { LEADERBOARD_CACHE_TAG } from "@/lib/game/queries";
import { calculateAwardedPoints, calculateCurrentStreak, countClaimsToday } from "@/lib/game/progress";
import { getDistrictByCode } from "@/lib/game/praha112";
import { prisma } from "@/lib/prisma";
import { districtClaimSchema, getValidationMessage } from "@/lib/validation/game";

type ClaimRouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, context: ClaimRouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { code } = await context.params;
  const district = getDistrictByCode(code);

  if (!district) {
    return NextResponse.json(
      { message: "Městská část nebyla nalezena." },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      { message: "Neplatné tělo požadavku." },
      { status: 400 },
    );
  }

  const parsed = districtClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: getValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

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
      { message: "Tato městská část už byla potvrzena." },
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

  const claim = await prisma.districtClaim.create({
    data: {
      userId,
      districtCode: district.code,
      chapterSlug: district.chapterSlug,
      districtName: district.name,
      selfieUrl: parsed.data.selfieUrl,
      signVisible: parsed.data.attestSignVisible,
      claimedAt: now,
      basePoints: district.basePoints,
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

  revalidateTag(LEADERBOARD_CACHE_TAG, "max");

  return NextResponse.json(
    {
      message: "Městská část byla úspěšně potvrzena.",
      claim,
      streakAfterClaim,
    },
    { status: 201 },
  );
}
