import { CHAPTERS, DISTRICTS, getDistrictsByChapter, getTotalDistrictCount } from "@/lib/game/district-catalog";
import {
  calculateAwardedPoints,
  calculateCurrentStreak,
  countClaimsToday,
} from "@/lib/game/scoring-core";

export type ClaimSnapshot = {
  districtCode: string;
  awardedPoints: number;
  claimedAt: Date;
};

export { calculateAwardedPoints, calculateCurrentStreak, countClaimsToday };

export function buildOverview(claims: ClaimSnapshot[]) {
  const totalCompleted = claims.length;
  const totalDistricts = getTotalDistrictCount();
  const totalPoints = claims.reduce((sum, claim) => sum + claim.awardedPoints, 0);
  const completionPercent = Math.round((totalCompleted / totalDistricts) * 1000) / 10;
  const currentStreak = calculateCurrentStreak(claims.map((claim) => claim.claimedAt));
  const completedCodes = new Set(claims.map((claim) => claim.districtCode));

  const chapterCards = CHAPTERS.map((chapter) => {
    const chapterDistricts = getDistrictsByChapter(chapter.slug);
    const completed = chapterDistricts.filter((district) =>
      completedCodes.has(district.code),
    ).length;
    const progressPercent = Math.round((completed / chapterDistricts.length) * 100);

    return {
      ...chapter,
      completed,
      total: chapterDistricts.length,
      progressPercent,
      preview: chapterDistricts.map((district) => ({
        code: district.code,
        completed: completedCodes.has(district.code),
      })),
    };
  });

  return {
    totalCompleted,
    totalDistricts,
    completionPercent,
    currentStreak,
    totalPoints,
    chapterCards,
    completedCodes,
  };
}

export function getDistrictCompletionMap(claims: { districtCode: string }[]) {
  const completed = new Set(claims.map((claim) => claim.districtCode));

  return new Map(
    DISTRICTS.map((district) => [district.code, completed.has(district.code)]),
  );
}
