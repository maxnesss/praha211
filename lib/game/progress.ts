import { CHAPTERS, DISTRICTS, getDistrictsByChapter, getTotalDistrictCount } from "@/lib/game/district-catalog";

type ClaimSnapshot = {
  districtCode: string;
  awardedPoints: number;
  claimedAt: Date;
};

const PRAGUE_TIME_ZONE = "Europe/Prague";
const pragueDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRAGUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toPragueDayKey(date: Date) {
  const parts = pragueDayFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function getPreviousDayKey(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map((part) => Number.parseInt(part, 10));
  if (
    Number.isNaN(year)
    || Number.isNaN(month)
    || Number.isNaN(day)
  ) {
    return "0000-00-00";
  }

  const previousUtc = new Date(Date.UTC(year, month - 1, day - 1));
  const previousYear = previousUtc.getUTCFullYear();
  const previousMonth = String(previousUtc.getUTCMonth() + 1).padStart(2, "0");
  const previousDay = String(previousUtc.getUTCDate()).padStart(2, "0");

  return `${previousYear}-${previousMonth}-${previousDay}`;
}

function sortDayKeysDesc(keys: Iterable<string>) {
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}

export function calculateCurrentStreak(claimDates: Date[], now = new Date()) {
  if (claimDates.length === 0) {
    return 0;
  }

  const uniqueKeys = new Set(claimDates.map((date) => toPragueDayKey(date)));
  const sorted = sortDayKeysDesc(uniqueKeys);
  const todayKey = toPragueDayKey(now);
  const yesterdayKey = getPreviousDayKey(todayKey);

  if (sorted[0] !== todayKey && sorted[0] !== yesterdayKey) {
    return 0;
  }

  let currentKey = sorted[0];
  let streak = 0;

  for (;;) {
    if (!uniqueKeys.has(currentKey)) {
      break;
    }

    streak += 1;
    currentKey = getPreviousDayKey(currentKey);
  }

  return streak;
}

export function countClaimsToday(claimDates: Date[], now = new Date()) {
  const todayKey = toPragueDayKey(now);
  return claimDates.filter((date) => toPragueDayKey(date) === todayKey).length;
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
        name: district.name,
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
