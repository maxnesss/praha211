import { DISTRICT_STORIES } from "./district-stories.ts";
import { resolveCoatAssetKey } from "./coat-assets.ts";
import { calculateLongestStreak } from "./scoring-core.ts";
import {
  CHAPTERS,
  DISTRICTS,
  getDistrictsByChapter,
  type ChapterSlug,
} from "./district-catalog.ts";

export const PRAHA_BADGE_NUMBERS = Array.from({ length: 22 }, (_, index) => index + 1);

const chapterAccentBySlug = new Map(
  CHAPTERS.map((chapter) => [chapter.slug, chapter.accentColor]),
);

const PRAGUE_TIME_ZONE = "Europe/Prague";
const pragueWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PRAGUE_TIME_ZONE,
  weekday: "short",
});
const pragueHourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PRAGUE_TIME_ZONE,
  hour: "2-digit",
  hour12: false,
});

const PROGRESS_THRESHOLDS = [1, 10, 25, 50, 75, 100, 112];
const STREAK_THRESHOLDS = [3, 7, 14, 30];
const progressBadgeImageByThreshold = new Map<number, { src: string; alt: string }>([
  [1, { src: "/badges/progress_1.webp", alt: "Odznak prvního potvrzení" }],
  [10, { src: "/badges/progress_10.webp", alt: "Odznak 10 potvrzení" }],
  [25, { src: "/badges/progress_25.webp", alt: "Odznak 25 potvrzení" }],
  [75, { src: "/badges/progress_75.webp", alt: "Odznak 75 potvrzení" }],
  [100, { src: "/badges/progress_100.webp", alt: "Odznak 100 potvrzení" }],
  [112, { src: "/badges/progress_112.webp", alt: "Odznak 112 potvrzení" }],
]);

function extractPrahaNumbers(text: string) {
  const numbers = new Set<number>();
  const matches = text.matchAll(/\bPraha(?:\s|-)(\d{1,2})\b/g);

  for (const match of matches) {
    const parsed = Number.parseInt(match[1] ?? "", 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 22) {
      continue;
    }
    numbers.add(parsed);
  }

  return [...numbers].sort((a, b) => a - b);
}

const districtPrahaNumbers = new Map(
  DISTRICTS.map((district) => {
    const story = DISTRICT_STORIES[district.code];
    const sourceText = [story?.history ?? "", story?.funFact ?? ""]
      .join(" ")
      .trim();
    const numbers = extractPrahaNumbers(sourceText);

    return [district.code, numbers] as const;
  }),
);

const prahaDistrictCodes = new Map(
  PRAHA_BADGE_NUMBERS.map((number) => [number, new Set<string>()] as const),
);

for (const district of DISTRICTS) {
  const numbers = districtPrahaNumbers.get(district.code) ?? [];
  for (const number of numbers) {
    prahaDistrictCodes.get(number)?.add(district.code);
  }
}

export function getPrahaBadgeDistrictCodes(number: number) {
  return [...(prahaDistrictCodes.get(number) ?? new Set<string>())];
}

export type DistrictBadge = {
  code: string;
  name: string;
  coatAssetKey: string;
  chapterSlug: ChapterSlug;
  accentColor: string;
  unlocked: boolean;
};

export type ChapterBadge = {
  slug: ChapterSlug;
  name: string;
  accentColor: string;
  completed: number;
  total: number;
  unlocked: boolean;
};

export type PrahaBadge = {
  number: number;
  completed: number;
  total: number;
  unlocked: boolean;
};

export type AchievementBadgeCategory =
  | "PROGRESS"
  | "STREAK"
  | "RHYTHM"
  | "TEAM";

export type AchievementBadge = {
  id: string;
  title: string;
  subtitle: string;
  category: AchievementBadgeCategory;
  unlocked: boolean;
  accentColor: string;
  imageSrc?: string;
  imageAlt?: string;
  shortLabel?: string;
};

export type BadgeOverviewContext = {
  claimDates?: Date[];
  joinedTeam?: boolean;
  hasBeenTeamLeader?: boolean;
};

export type BadgeOverview = {
  districtBadges: DistrictBadge[];
  chapterBadges: ChapterBadge[];
  prahaBadges: PrahaBadge[];
  achievementBadges: AchievementBadge[];
  totals: {
    unlocked: number;
    total: number;
    districtsUnlocked: number;
    chaptersUnlocked: number;
    prahaUnlocked: number;
    achievementsUnlocked: number;
  };
};

function toPragueWeekday(date: Date) {
  return pragueWeekdayFormatter.format(date).toLowerCase();
}

function toPragueHour(date: Date) {
  const value = pragueHourFormatter.format(date);
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? null : parsed;
}

function buildProgressAchievementBadges(totalClaims: number): AchievementBadge[] {
  return PROGRESS_THRESHOLDS.map((threshold) => {
    const image = progressBadgeImageByThreshold.get(threshold);

    return {
      id: `progress_${threshold}`,
      title: threshold === 1 ? "První potvrzení" : `${threshold} potvrzení`,
      subtitle: "Postup",
      category: "PROGRESS",
      unlocked: totalClaims >= threshold,
      accentColor: "#f59e0b",
      imageSrc: image?.src,
      imageAlt: image?.alt,
      shortLabel: String(threshold),
    };
  });
}

function buildStreakAchievementBadges(claimDates: Date[]): AchievementBadge[] {
  const longestStreak = calculateLongestStreak(claimDates);

  return STREAK_THRESHOLDS.map((threshold) => ({
    id: `streak_${threshold}`,
    title: `Série ${threshold} dní`,
    subtitle: "Série",
    category: "STREAK",
    unlocked: longestStreak >= threshold,
    accentColor: "#22d3ee",
    shortLabel: `${threshold}D`,
  }));
}

function buildRhythmAchievementBadges(claimDates: Date[]): AchievementBadge[] {
  let hasSaturday = false;
  let hasSunday = false;
  let hasEarlyBird = false;
  let hasNightOwl = false;

  for (const claimDate of claimDates) {
    const weekday = toPragueWeekday(claimDate);
    if (weekday === "sat") {
      hasSaturday = true;
    }
    if (weekday === "sun") {
      hasSunday = true;
    }

    const hour = toPragueHour(claimDate);
    if (hour !== null && hour >= 5 && hour <= 10) {
      hasEarlyBird = true;
    }
    if (hour !== null && hour >= 21 && hour <= 23) {
      hasNightOwl = true;
    }
  }

  return [
    {
      id: "rhythm_weekend_patrol",
      title: "Víkendová hlídka",
      subtitle: "Sobota + neděle",
      category: "RHYTHM",
      unlocked: hasSaturday && hasSunday,
      accentColor: "#14b8a6",
      shortLabel: "WE",
    },
    {
      id: "rhythm_early_bird",
      title: "Ranní ptáče",
      subtitle: "Ráno (5:00-10:59)",
      category: "RHYTHM",
      unlocked: hasEarlyBird,
      accentColor: "#f97316",
      shortLabel: "AM",
    },
    {
      id: "rhythm_night_owl",
      title: "Noční sova",
      subtitle: "Pozdní večer (21:00-23:59)",
      category: "RHYTHM",
      unlocked: hasNightOwl,
      accentColor: "#8b5cf6",
      shortLabel: "PM",
    },
  ];
}

function buildTeamAchievementBadges(input: {
  joinedTeam: boolean;
  hasBeenTeamLeader: boolean;
}): AchievementBadge[] {
  return [
    {
      id: "team_joined_first",
      title: "První tým",
      subtitle: "Připojení do týmu",
      category: "TEAM",
      unlocked: input.joinedTeam,
      accentColor: "#10b981",
      imageSrc: "/badges/team_joined.png",
      imageAlt: "Odznak prvního týmu",
      shortLabel: "T1",
    },
    {
      id: "team_has_led",
      title: "Velitel týmu",
      subtitle: "Někdy byl velitelem",
      category: "TEAM",
      unlocked: input.hasBeenTeamLeader,
      accentColor: "#ef4444",
      imageSrc: "/badges/team_leader.png",
      imageAlt: "Odznak velitele týmu",
      shortLabel: "TL",
    },
  ];
}

export function buildBadgeOverview(
  claimedCodes: Set<string>,
  context?: BadgeOverviewContext,
): BadgeOverview {
  const normalizedClaims = new Set([...claimedCodes].map((code) => code.toUpperCase()));
  const claimDates = context?.claimDates ?? [];
  const totalClaims = normalizedClaims.size;

  const districtBadges: DistrictBadge[] = DISTRICTS.map((district) => ({
    code: district.code,
    name: district.name,
    coatAssetKey: resolveCoatAssetKey(district.coatAssetKey),
    chapterSlug: district.chapterSlug,
    accentColor: chapterAccentBySlug.get(district.chapterSlug) ?? "#94a3b8",
    unlocked: normalizedClaims.has(district.code),
  }));

  const chapterBadges: ChapterBadge[] = CHAPTERS.map((chapter) => {
    const chapterDistricts = getDistrictsByChapter(chapter.slug);
    const completed = chapterDistricts.filter((district) =>
      normalizedClaims.has(district.code),
    ).length;

    return {
      slug: chapter.slug,
      name: chapter.name,
      accentColor: chapter.accentColor,
      completed,
      total: chapterDistricts.length,
      unlocked: completed === chapterDistricts.length,
    };
  });

  const prahaBadges: PrahaBadge[] = PRAHA_BADGE_NUMBERS.map((number) => {
    const codes = [...(prahaDistrictCodes.get(number) ?? new Set<string>())];
    const completed = codes.filter((code) => normalizedClaims.has(code)).length;

    return {
      number,
      completed,
      total: codes.length,
      unlocked: codes.length > 0 && completed === codes.length,
    };
  });

  const districtsUnlocked = districtBadges.filter((badge) => badge.unlocked).length;
  const chaptersUnlocked = chapterBadges.filter((badge) => badge.unlocked).length;
  const prahaUnlocked = prahaBadges.filter((badge) => badge.unlocked).length;
  const achievementBadges = [
    ...buildProgressAchievementBadges(totalClaims),
    ...buildStreakAchievementBadges(claimDates),
    ...buildRhythmAchievementBadges(claimDates),
    ...buildTeamAchievementBadges({
      joinedTeam: Boolean(context?.joinedTeam),
      hasBeenTeamLeader: Boolean(context?.hasBeenTeamLeader),
    }),
  ];
  const achievementsUnlocked = achievementBadges.filter((badge) => badge.unlocked).length;
  const total = districtBadges.length + chapterBadges.length + prahaBadges.length + achievementBadges.length;
  const unlocked = districtsUnlocked + chaptersUnlocked + prahaUnlocked + achievementsUnlocked;

  return {
    districtBadges,
    chapterBadges,
    prahaBadges,
    achievementBadges,
    totals: {
      unlocked,
      total,
      districtsUnlocked,
      chaptersUnlocked,
      prahaUnlocked,
      achievementsUnlocked,
    },
  };
}
