import { prisma } from "@/lib/prisma";

export async function getUserGameClaims(userId: string) {
  return prisma.districtClaim.findMany({
    where: { userId },
    select: {
      districtCode: true,
      awardedPoints: true,
      claimedAt: true,
    },
    orderBy: { claimedAt: "desc" },
  });
}

export async function getUserClaimedDistrictCodes(userId: string) {
  const claims = await prisma.districtClaim.findMany({
    where: { userId },
    select: { districtCode: true },
  });

  return new Set(claims.map((claim) => claim.districtCode));
}
