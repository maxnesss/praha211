export type ChapterSlug =
  | "kralovske-jadro"
  | "ricni-vysiny"
  | "severni-hranice"
  | "betonove-plane"
  | "lesni-pas"
  | "rozlamane-kopce"
  | "cisarsky-hreben";

export type ChapterDefinition = {
  slug: ChapterSlug;
  name: string;
  accentColor: string;
};

export type DistrictDefinition = {
  code: string;
  name: string;
  coatAssetKey: string;
  chapterSlug: ChapterSlug;
  chapterName: string;
  chapterIndex: number;
  indexInChapter: number;
  basePoints: number;
};

export const CHAPTERS: ChapterDefinition[] = [
  {
    slug: "kralovske-jadro",
    name: "Královské jádro",
    accentColor: "#d4a373",
  },
  {
    slug: "ricni-vysiny",
    name: "Říční výšiny",
    accentColor: "#4e8098",
  },
  {
    slug: "severni-hranice",
    name: "Severní hranice",
    accentColor: "#7c8c6b",
  },
  {
    slug: "betonove-plane",
    name: "Betonové pláně",
    accentColor: "#7a7a7a",
  },
  {
    slug: "lesni-pas",
    name: "Lesní pás",
    accentColor: "#5a7d5a",
  },
  {
    slug: "rozlamane-kopce",
    name: "Rozlámané kopce",
    accentColor: "#8b6f47",
  },
  {
    slug: "cisarsky-hreben",
    name: "Císařský hřeben",
    accentColor: "#915f6d",
  },
];

const DISTRICTS_PER_CHAPTER = 16;
const TOTAL_DISTRICTS = CHAPTERS.length * DISTRICTS_PER_CHAPTER;

const CHAPTER_DISTRICT_NAMES: Record<ChapterSlug, string[]> = {
  "kralovske-jadro": [
    "Staré Město",
    "Nové Město",
    "Josefov",
    "Malá Strana",
    "Hradčany",
    "Vyšehrad",
    "Vinohrady",
    "Žižkov",
    "Nusle",
    "Karlín",
    "Smíchov",
    "Podolí",
    "Braník",
    "Holešovice",
    "Bubeneč",
    "Hodkovičky",
  ],
  "ricni-vysiny": [
    "Troja",
    "Bohnice",
    "Kobylisy",
    "Čimice",
    "Dolní Chabry",
    "Březiněves",
    "Ďáblice",
    "Libeň",
    "Prosek",
    "Střížkov",
    "Hloubětín",
    "Vysočany",
    "Sedlec",
    "Suchdol",
    "Lysolaje",
    "Střešovice",
  ],
  "severni-hranice": [
    "Kbely",
    "Letňany",
    "Čakovice",
    "Miškovice",
    "Třeboradice",
    "Satalice",
    "Vinoř",
    "Horní Počernice",
    "Újezd nad Lesy",
    "Klánovice",
    "Běchovice",
    "Dolní Počernice",
    "Hostavice",
    "Kyje",
    "Černý Most",
    "Koloděje",
  ],
  "betonove-plane": [
    "Hrdlořezy",
    "Malešice",
    "Strašnice",
    "Záběhlice",
    "Michle",
    "Vršovice",
    "Hostivař",
    "Horní Měcholupy",
    "Dolní Měcholupy",
    "Petrovice",
    "Štěrboholy",
    "Háje",
    "Chodov",
    "Pitkovice",
    "Uhříněves",
    "Hájek u Uhříněvsi",
  ],
  "lesni-pas": [
    "Krč",
    "Lhotka",
    "Kamýk",
    "Libuš",
    "Písnice",
    "Kunratice",
    "Šeberov",
    "Křeslice",
    "Komořany",
    "Modřany",
    "Točná",
    "Cholupice",
    "Zbraslav",
    "Radotín",
    "Velká Chuchle",
    "Malá Chuchle",
  ],
  "rozlamane-kopce": [
    "Hlubočepy",
    "Holyně",
    "Slivenec",
    "Lochkov",
    "Lahovice",
    "Lipence",
    "Zadní Kopanina",
    "Řeporyje",
    "Třebonice",
    "Stodůlky",
    "Sobín",
    "Zličín",
    "Řepy",
    "Motol",
    "Radlice",
    "Jinonice",
  ],
  "cisarsky-hreben": [
    "Dejvice",
    "Břevnov",
    "Košíře",
    "Liboc",
    "Veleslavín",
    "Vokovice",
    "Ruzyně",
    "Nebušice",
    "Přední Kopanina",
    "Benice",
    "Dubeč",
    "Kolovraty",
    "Lipany",
    "Nedvězí u Říčan",
    "Královice",
    "Újezd u Průhonic",
  ],
};

function getDistrictCode(index: number) {
  return `D${String(index + 1).padStart(3, "0")}`;
}

export function toDistrictAssetKey(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const DISTRICTS: DistrictDefinition[] = CHAPTERS.flatMap(
  (chapter, chapterIndex) => {
    const districtNames = CHAPTER_DISTRICT_NAMES[chapter.slug];

    if (districtNames.length !== DISTRICTS_PER_CHAPTER) {
      throw new Error(
        `Kapitola "${chapter.slug}" musí mít přesně ${DISTRICTS_PER_CHAPTER} městských částí.`,
      );
    }

    return districtNames.map((districtName, indexInChapter) => {
      const globalIndex = chapterIndex * DISTRICTS_PER_CHAPTER + indexInChapter;
      const ringBonus = (chapterIndex + 1) * 6;
      const gridBonus = ((indexInChapter % 4) + 1) * 3;

      return {
        code: getDistrictCode(globalIndex),
        name: districtName,
        coatAssetKey: toDistrictAssetKey(districtName),
        chapterSlug: chapter.slug,
        chapterName: chapter.name,
        chapterIndex,
        indexInChapter,
        basePoints: 90 + ringBonus + gridBonus,
      };
    });
  },
);

export const DISTRICT_CODES = new Set(DISTRICTS.map((district) => district.code));

export const DISTRICT_BY_CODE = new Map(
  DISTRICTS.map((district) => [district.code, district]),
);

export const DISTRICTS_BY_CHAPTER = new Map(
  CHAPTERS.map((chapter) => [
    chapter.slug,
    DISTRICTS.filter((district) => district.chapterSlug === chapter.slug),
  ]),
);

export function getDistrictByCode(code: string) {
  return DISTRICT_BY_CODE.get(code.toUpperCase());
}

export function getChapterBySlug(slug: string) {
  return CHAPTERS.find((chapter) => chapter.slug === slug);
}

export function getDistrictsByChapter(slug: string) {
  return DISTRICTS_BY_CHAPTER.get(slug as ChapterSlug) ?? [];
}

export function getTotalDistrictCount() {
  return TOTAL_DISTRICTS;
}
