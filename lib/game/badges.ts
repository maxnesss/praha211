import { DISTRICT_STORIES } from "@/lib/game/district-stories";
import { resolveCoatAssetKey } from "@/lib/game/coat-assets";
import {
  CHAPTERS,
  DISTRICTS,
  getDistrictsByChapter,
  type ChapterSlug,
} from "@/lib/game/praha112";

const PRAHA_BADGE_NUMBERS = Array.from({ length: 22 }, (_, index) => index + 1);

const chapterAccentBySlug = new Map(
  CHAPTERS.map((chapter) => [chapter.slug, chapter.accentColor]),
);

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

export type BadgeOverview = {
  districtBadges: DistrictBadge[];
  chapterBadges: ChapterBadge[];
  prahaBadges: PrahaBadge[];
  totals: {
    unlocked: number;
    total: number;
    districtsUnlocked: number;
    chaptersUnlocked: number;
    prahaUnlocked: number;
  };
};

export function buildBadgeOverview(claimedCodes: Set<string>): BadgeOverview {
  const normalizedClaims = new Set([...claimedCodes].map((code) => code.toUpperCase()));

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
  const total = districtBadges.length + chapterBadges.length + prahaBadges.length;
  const unlocked = districtsUnlocked + chaptersUnlocked + prahaUnlocked;

  return {
    districtBadges,
    chapterBadges,
    prahaBadges,
    totals: {
      unlocked,
      total,
      districtsUnlocked,
      chaptersUnlocked,
      prahaUnlocked,
    },
  };
}
