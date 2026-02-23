import { CHAPTERS, DISTRICTS, getDistrictsByChapter, getTotalDistrictCount } from "@/lib/game/district-catalog";

type ClaimSnapshot = {
  districtCode: string;
  awardedPoints: number;
  claimedAt: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDayStart(date: Date) {
  return new Date(`${toUtcDayKey(date)}T00:00:00.000Z`);
}

function utcDayEndExclusive(date: Date) {
  return new Date(utcDayStart(date).getTime() + MS_PER_DAY);
}

function sortDayKeysDesc(keys: Iterable<string>) {
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}

export function calculateCurrentStreak(claimDates: Date[], now = new Date()) {
  if (claimDates.length === 0) {
    return 0;
  }

  const uniqueKeys = new Set(claimDates.map((date) => toUtcDayKey(date)));
  const sorted = sortDayKeysDesc(uniqueKeys);
  const todayKey = toUtcDayKey(now);
  const yesterdayKey = toUtcDayKey(new Date(utcDayStart(now).getTime() - MS_PER_DAY));

  if (sorted[0] !== todayKey && sorted[0] !== yesterdayKey) {
    return 0;
  }

  const start = sorted[0] === todayKey ? utcDayStart(now) : new Date(utcDayStart(now).getTime() - MS_PER_DAY);
  let streak = 0;

  for (let i = 0; ; i += 1) {
    const key = toUtcDayKey(new Date(start.getTime() - i * MS_PER_DAY));
    if (!uniqueKeys.has(key)) {
      break;
    }
    streak += 1;
  }

  return streak;
}

export function countClaimsToday(claimDates: Date[], now = new Date()) {
  const start = utcDayStart(now).getTime();
  const end = utcDayEndExclusive(now).getTime();

  return claimDates.filter((date) => {
    const time = date.getTime();
    return time >= start && time < end;
  }).length;
}

export function calculateAwardedPoints(input: {
  basePoints: number;
  claimsTodayBefore: number;
  streakAfterClaim: number;
}) {
  const sameDayMultiplier = Math.min(2, 1 + input.claimsTodayBefore * 0.15);
  const streakBonus = input.streakAfterClaim * 5;
  const awardedPoints = Math.round(input.basePoints * sameDayMultiplier + streakBonus);

  return {
    sameDayMultiplier,
    streakBonus,
    awardedPoints,
  };
}

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
