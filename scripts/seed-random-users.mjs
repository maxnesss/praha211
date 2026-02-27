#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomInt } from "node:crypto";
import { z } from "zod";

const prisma = new PrismaClient();
const args = process.argv.slice(2);

const FIRST_NAMES = [
  "Adam",
  "Jakub",
  "Matěj",
  "Lukáš",
  "Vojtěch",
  "David",
  "Tomáš",
  "Jan",
  "Daniel",
  "Petr",
  "Tereza",
  "Eliška",
  "Anna",
  "Karolína",
  "Klára",
  "Lucie",
  "Veronika",
  "Kristýna",
  "Barbora",
  "Adéla",
];

const LAST_NAMES = [
  "Novák",
  "Svoboda",
  "Dvořák",
  "Černý",
  "Procházka",
  "Kučera",
  "Veselý",
  "Horák",
  "Němec",
  "Marek",
  "Novotná",
  "Pokorná",
  "Králová",
  "Jelínková",
  "Pospíšilová",
  "Fialová",
  "Benešová",
  "Tichá",
  "Krejčí",
  "Urban",
];

const NICK_PREFIXES = [
  "metro",
  "praha",
  "lovec",
  "tram",
  "vltava",
  "streak",
  "body",
  "district",
  "explorer",
  "runner",
];

const NICK_SUFFIXES = [
  "fox",
  "wolf",
  "hawk",
  "pilot",
  "rider",
  "pulse",
  "jet",
  "atlas",
  "quest",
  "nova",
];

const PRAGUE_TIME_ZONE = "Europe/Prague";
const TEAM_MAX_MEMBERS = 5;
const pragueDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRAGUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function hasFlag(flag) {
  return args.includes(flag);
}

function getArgValue(flag) {
  const inline = args.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);

  const index = args.indexOf(flag);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function printUsage() {
  console.log(`
Vytvoří náhodné testovací uživatele s náhodným postupem (claimy městských částí).

Použití:
  npm run users:seed:random

Volitelné:
  --count 30                 Počet uživatelů (výchozí: 30)
  --password "TestPass123"   Heslo pro všechny vytvořené uživatele
  --domain "seed.local"      Doména pro e-mailové adresy
  --min-progress 0           Minimální počet claimů na uživatele
  --max-progress 112         Maximální počet claimů na uživatele
  --teams                    Vytvoří i náhodné týmy a přiřadí do nich uživatele
  --team-count 6             Cílový počet týmů (volitelné, při --teams)
                             Pokud kapacita nestačí, část uživatelů zůstane bez týmu
  --dry-run                  Pouze simulace, bez zápisu do DB
  --help

Příklady:
  npm run users:seed:random -- --count 30
  npm run users:seed:random -- --count 50 --min-progress 5 --max-progress 35
  npm run users:seed:random -- --count 30 --teams --team-count 6
  npm run users:seed:random -- --password "SeedPass123" --domain "example.local"
`);
}

function pickRandom(list) {
  return list[randomInt(0, list.length)];
}

function createSeedNickname() {
  return `${pickRandom(NICK_PREFIXES)}_${pickRandom(NICK_SUFFIXES)}${randomInt(10, 999)}`;
}

function generateUniqueSeedNickname(reservedNicknames) {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const candidate = createSeedNickname();
    const key = candidate.toLocaleLowerCase("cs-CZ");
    if (!reservedNicknames.has(key)) {
      reservedNicknames.add(key);
      return candidate;
    }
  }

  const fallback = `hrac_${Date.now().toString(36)}${randomInt(1000, 9999)}`;
  reservedNicknames.add(fallback.toLocaleLowerCase("cs-CZ"));
  return fallback;
}

function normalizeSlug(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function sampleWithoutReplacement(input, count) {
  const items = [...input];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, count);
}

function randomClaimDates(count) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const result = [];

  for (let i = 0; i < count; i += 1) {
    const daysAgo = randomInt(0, 180);
    const offsetMs = randomInt(0, dayMs);
    result.push(new Date(now - daysAgo * dayMs - offsetMs));
  }

  return result.sort((a, b) => a.getTime() - b.getTime());
}

function toPragueDayKey(date) {
  const parts = pragueDayFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function getPreviousDayKey(dayKey) {
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

function sortDayKeysDesc(keys) {
  return [...keys].sort((a, b) => (a < b ? 1 : -1));
}

function calculateCurrentStreak(claimDates, now = new Date()) {
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

function countClaimsToday(claimDates, now = new Date()) {
  const todayKey = toPragueDayKey(now);
  return claimDates.filter((date) => toPragueDayKey(date) === todayKey).length;
}

function calculateAwardedPoints(input) {
  const sameDayMultiplier = Math.min(2, 1 + input.claimsTodayBefore * 0.15);
  const streakBonus = input.streakAfterClaim * 5;
  const awardedPoints = Math.round(input.basePoints * sameDayMultiplier + streakBonus);

  return {
    sameDayMultiplier,
    streakBonus,
    awardedPoints,
  };
}

function toTeamSlug(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function shuffledCopy(input) {
  const copy = [...input];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index + 1);
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function buildTeamBuckets(users, teamCount, assignableUsersCount) {
  const buckets = Array.from({ length: teamCount }, () => []);
  const randomizedUsers = shuffledCopy(users).slice(0, assignableUsersCount);

  for (let index = 0; index < randomizedUsers.length; index += 1) {
    buckets[index % teamCount].push(randomizedUsers[index]);
  }

  return buckets.filter((bucket) => bucket.length > 0);
}

function resolveTeamCount(totalUsers, requestedTeamCount) {
  const maxTeams = Math.max(1, totalUsers);

  if (requestedTeamCount !== undefined) {
    const resolvedTeamCount = Math.min(maxTeams, Math.max(1, requestedTeamCount));
    const assignableUsersCount = Math.min(totalUsers, resolvedTeamCount * TEAM_MAX_MEMBERS);
    return {
      requested: requestedTeamCount,
      resolved: resolvedTeamCount,
      assignableUsersCount,
      unassignedUsersCount: totalUsers - assignableUsersCount,
      mode: "fixed",
    };
  }

  const resolvedTeamCount = Math.max(1, Math.ceil(totalUsers / TEAM_MAX_MEMBERS));
  return {
    requested: null,
    resolved: resolvedTeamCount,
    assignableUsersCount: totalUsers,
    unassignedUsersCount: 0,
    mode: "auto",
  };
}

function createTeamName(index) {
  const TEAM_ADJECTIVES = [
    "Městští",
    "Noční",
    "Električtí",
    "Vltavští",
    "Železní",
    "Střešní",
    "Pouliční",
    "Rychlí",
  ];
  const TEAM_NOUNS = [
    "Rytíři",
    "Průzkumníci",
    "Velitelé",
    "Lovci",
    "Navigátoři",
    "Hlídači",
    "Pionýři",
    "Kurýři",
  ];

  return `${pickRandom(TEAM_ADJECTIVES)} ${pickRandom(TEAM_NOUNS)} ${index + 1}`;
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  const parsedOptions = z
    .object({
      count: z.coerce.number().int().min(1).max(500).default(30),
      password: z.string().min(3).default("TestPass123"),
      domain: z.string().trim().min(3).default("seed.praha112.local"),
      minProgress: z.coerce.number().int().min(0).default(0),
      maxProgress: z.coerce.number().int().min(0).default(112),
      teams: z.boolean().default(false),
      teamCount: z.coerce.number().int().min(1).max(500).optional(),
      dryRun: z.boolean().default(false),
    })
    .safeParse({
      count: getArgValue("--count"),
      password: getArgValue("--password"),
      domain: getArgValue("--domain"),
      minProgress: getArgValue("--min-progress"),
      maxProgress: getArgValue("--max-progress"),
      teams: hasFlag("--teams") || getArgValue("--team-count") !== undefined,
      teamCount: getArgValue("--team-count"),
      dryRun: hasFlag("--dry-run"),
    });

  if (!parsedOptions.success) {
    const message = parsedOptions.error.issues[0]?.message ?? "Neplatné parametry.";
    console.error(`Chyba: ${message}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const options = parsedOptions.data;

  const [
    { DISTRICTS },
    { USER_AVATAR_VALUES, DEFAULT_USER_AVATAR },
  ] = await Promise.all([
    import("../lib/game/district-catalog.ts"),
    import("../lib/profile-avatars.ts"),
  ]);

  const totalDistricts = DISTRICTS.length;
  const minProgress = Math.max(0, Math.min(options.minProgress, totalDistricts));
  const maxProgress = Math.max(minProgress, Math.min(options.maxProgress, totalDistricts));
  const passwordHash = await hash(options.password, 12);
  const timestamp = Date.now().toString(36);
  const reservedNicknames = new Set();

  if (!options.dryRun) {
    const existingNicknames = await prisma.user.findMany({
      where: { nickname: { not: null } },
      select: { nickname: true },
    });

    for (const entry of existingNicknames) {
      if (entry.nickname) {
        reservedNicknames.add(entry.nickname.toLocaleLowerCase("cs-CZ"));
      }
    }
  }

  let createdUsers = 0;
  let createdClaims = 0;
  let createdTeams = 0;
  let assignedUsersToTeams = 0;
  let usersWithoutTeam = 0;
  const seededUsers = [];

  for (let index = 0; index < options.count; index += 1) {
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const nickname = generateUniqueSeedNickname(reservedNicknames);
    const uniq = `${timestamp}${index.toString().padStart(3, "0")}${randomInt(1000, 9999)}`;
    const emailLocal = normalizeSlug(`${firstName}.${lastName}.${uniq}`);
    const email = `${emailLocal}@${options.domain}`.toLowerCase();
    const avatar = pickRandom(USER_AVATAR_VALUES) ?? DEFAULT_USER_AVATAR;
    const progressCount = randomInt(minProgress, maxProgress + 1);
    const unlockedDistricts = sampleWithoutReplacement(DISTRICTS, progressCount);
    const claimDates = randomClaimDates(progressCount);

    const historicalDates = [];
    const claimsData = unlockedDistricts.map((district, claimIndex) => {
      const claimedAt = claimDates[claimIndex];
      const claimsTodayBefore = countClaimsToday(historicalDates, claimedAt);
      const streakAfterClaim = calculateCurrentStreak([...historicalDates, claimedAt], claimedAt);
      const scoring = calculateAwardedPoints({
        basePoints: district.basePoints,
        claimsTodayBefore,
        streakAfterClaim,
      });

      historicalDates.push(claimedAt);

      return {
        districtCode: district.code,
        chapterSlug: district.chapterSlug,
        districtName: district.name,
        selfieUrl: `https://example.com/selfies/${district.code.toLowerCase()}-${uniq}.jpg`,
        signVisible: randomInt(0, 100) >= 10,
        claimedAt,
        basePoints: district.basePoints,
        sameDayMultiplier: scoring.sameDayMultiplier,
        streakBonus: scoring.streakBonus,
        awardedPoints: scoring.awardedPoints,
      };
    });

    if (options.dryRun) {
      console.log(
        `[dry-run] ${email} | nickname=${nickname} | avatar=${avatar} | progress=${progressCount}/${totalDistricts}`,
      );
      createdUsers += 1;
      createdClaims += claimsData.length;
      seededUsers.push({
        id: `dry-user-${index + 1}`,
        name,
        nickname,
        email,
      });
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        nickname,
        avatar,
        passwordHash,
        role: "USER",
        claims: {
          create: claimsData,
        },
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
      },
    });

    createdUsers += 1;
    createdClaims += claimsData.length;
    seededUsers.push(user);
  }

  if (options.teams && seededUsers.length > 0) {
    const teamCountInfo = resolveTeamCount(seededUsers.length, options.teamCount);
    const teamBuckets = buildTeamBuckets(
      seededUsers,
      teamCountInfo.resolved,
      teamCountInfo.assignableUsersCount,
    );

    if (teamCountInfo.requested !== null && teamCountInfo.requested !== teamCountInfo.resolved) {
      console.log(
        `Upravuji počet týmů z ${teamCountInfo.requested} na ${teamCountInfo.resolved}.`,
      );
    }

    if (teamCountInfo.mode === "fixed" && teamCountInfo.unassignedUsersCount > 0) {
      console.log(
        `Kapacita ${teamCountInfo.resolved} týmů je ${teamCountInfo.assignableUsersCount} hráčů. ${teamCountInfo.unassignedUsersCount} hráčů zůstane bez týmu.`,
      );
    }

    for (let index = 0; index < teamBuckets.length; index += 1) {
      const members = teamBuckets[index];
      const leader = members[0];
      const teamName = createTeamName(index);
      const teamSlugBase = toTeamSlug(teamName);
      const teamSlug = `${teamSlugBase}-${timestamp}-${String(index + 1).padStart(2, "0")}`.slice(
        0,
        60,
      );

      if (options.dryRun) {
        const memberNames = members
          .map((member) => member.nickname || member.name || member.email)
          .join(", ");
        console.log(
          `[dry-run][team] ${teamName} (${teamSlug}) | velitel=${leader.nickname || leader.name || leader.email} | členové=${members.length}/${TEAM_MAX_MEMBERS} | ${memberNames}`,
        );
      } else {
        await prisma.team.create({
          data: {
            name: teamName,
            slug: teamSlug,
            leader: { connect: { id: leader.id } },
            users: {
              connect: members.map((member) => ({ id: member.id })),
            },
          },
          select: { id: true },
        });
      }

      createdTeams += 1;
      assignedUsersToTeams += members.length;
    }

    usersWithoutTeam = seededUsers.length - assignedUsersToTeams;
  }

  const mode = options.dryRun ? "Simulace dokončena" : "Seed dokončen";
  const teamSummary = options.teams
    ? `, týmů=${createdTeams}, přiřazených uživatelů=${assignedUsersToTeams}, bez týmu=${usersWithoutTeam}`
    : "";

  console.log(
    `${mode}: uživatelů=${createdUsers}, claimů=${createdClaims}${teamSummary}, rozsah postupu=${minProgress}-${maxProgress}/${totalDistricts}`,
  );
}

main()
  .catch((error) => {
    console.error("Seed random uživatelů selhal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
