# PRAHA 112

Webová hra pro dokončení všech 112 pražských katastrálních území, se systémem bodů, denní série, týmů a žebříčku hráčů.

Stack:
- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth (Credentials + Google)
- Zod

## Rychlý start

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Aplikace běží na `http://localhost:3000`.

## Herní model

- 7 kapitol x 16 městských částí = 112 cílů
- Dokončení je konečné (`112/112`)
- Body jsou nekonečné:
  - základní body za část
  - násobitel za více potvrzení ve stejný den
  - bonus za sérii dní
  - přesný výpočet: `awardedPoints = round(basePoints * sameDayMultiplier + streakBonus)`
  - `sameDayMultiplier = min(2, 1 + claimsTodayBefore * 0.15)`
  - `streakBonus = streakAfterClaim * 5`
- Pravidla V1 jsou trust-based:
  - hráč potvrzuje fyzickou návštěvu
  - hráč potvrzuje viditelnost oficiální cedule
  - claim používá serverový čas (`Europe/Prague`)
  - 1 uživatel může potvrdit danou část pouze jednou

## Hlavní funkce

- Přihlášení přes e-mail/heslo i Google
- Přehled postupu, bodů, série a odznaků
- Kapitoly a detail městské části
- Týmy:
  - hráč může být jen v jednom týmu
  - tým má max 5 členů
  - tým má velitele (zakladatel)
  - vstup probíhá přes žádost, kterou velitel schvaluje
- Žebříček:
  - rychlý náhled (top + tvoje pozice)
  - kompletní stránkovaný seznam
  - řazení: nejdřív body, při shodě počet odemčených částí
- Veřejný hráčský profil:
  - přezdívka (fallback iniciály)
  - tým
  - body
  - postup
  - mini odznaky

## Skripty

- `npm run dev` - vývojový server
- `npm run build` - produkční build
- `npm run start` - spuštění produkčního buildu
- `npm run lint` - ESLint
- `npm run prisma:generate` - generování Prisma Clientu
- `npm run prisma:migrate` - aplikace existujících migrací
- `npm run prisma:migrate:dev` - vytvoření + aplikace nové migrace (dev)
- `npm run prisma:push` - push schématu bez migračních souborů
- `npm run prisma:studio` - Prisma Studio
- `npm run user:add -- --email ... --password ...` - přidání uživatele přes CLI
- `npm run users:seed:random -- [parametry]` - seed náhodných uživatelů
- `npm run r2:smoke` - ověření Cloudflare R2 (1 upload + 1 download + verifikace + delete)

Příklady seedování:

```bash
# 30 uživatelů, stejné heslo, bez týmů
npm run users:seed:random -- --count 30 --password 123

# 30 uživatelů, 5 týmů (část uživatelů může zůstat bez týmu)
npm run users:seed:random -- --count 30 --password 123 --teams --team-count 5

# Seed s rozsahem postupu
npm run users:seed:random -- --count 30 --min-progress 5 --max-progress 70 --password 123
```

## Důležité routy

UI:
- `/` - veřejný landing
- `/overview` - přehled hráče
- `/chapter/[slug]` - kapitola
- `/district/[code]` - detail městské části
- `/body` - body
- `/pokladnice` - odznaky
- `/kniha-hrdinu` - rychlý žebříček
- `/kniha-hrdinu/list` - kompletní žebříček (stránkovaný)
- `/teams` - seznam týmů + vytvoření týmu
- `/team/[slug]` - detail týmu
- `/player/[userId]` - veřejný profil hráče
- `/profile` - nastavení účtu
- `/sign-in` - přihlášení
- `/sign-up` - registrace

API:
- `/api/auth/[...nextauth]`
- `/api/auth/register`
- `/api/districts/[code]/claim`
- `/api/districts/[code]/test-claim` (admin test endpoint)
- `/api/profile/avatar`
- `/api/profile/nickname`
- `/api/profile/password`
- `/api/teams`
- `/api/teams/[slug]/apply`
- `/api/teams/[slug]/leave`
- `/api/teams/[slug]/requests/[requestId]/approve`
- `/api/teams/[slug]/requests/[requestId]/reject`
- `/api/teams/[slug]/members/[memberId]/remove`
- `/api/uploads/selfie/sign` (podepsaný upload URL)
- `/api/uploads/selfie/view` (podepsaný download URL)
- `/api/contact`
- `/api/health/db`

## Databáze a modely

Klíčové modely:
- `User`
- `DistrictClaim`
- `Team`
- `TeamJoinRequest`

Poznámky:
- `nickname` je unikátní
- claim je unikátní přes `(userId, districtCode)`
- týmové žádosti jsou unikátní přes `(teamId, userId)`

## Bezpečnost a API poznámky

- Vybrané write endpointy mají rate limiting (registrace, kontakt, claim, týmové akce, změna hesla).
- Claim endpoint ošetřuje závodní stav (duplicate claim) a vrací konzistentní `409`.
- Health endpoint (`/api/health/db`) je určen primárně pro monitoring konektivity DB.
- Selfie se ukládají privátně do Cloudflare R2:
  - klient si vyžádá podepsaný upload URL (`/api/uploads/selfie/sign`)
  - do DB se ukládá klíč objektu (`selfies/...`), ne veřejná URL
  - zobrazení probíhá přes podepsaný download URL (`/api/uploads/selfie/view`)

## Auth a role

- Role: `USER`, `ADMIN`
- Noví uživatelé defaultně dostávají `USER`
- Veřejná je pouze landing stránka `/`
- Herní části a týmové části vyžadují přihlášení

Povýšení na admina:

```sql
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "email" = 'you@example.com';
```

Nebo vytvoření admina přes CLI:

```bash
npm run user:add -- --email admin@praha211.com --password "AdminPass123" --role ADMIN --name "Admin User"
```

## Obsah městských částí a znaky

- Katalog částí: `lib/game/district-catalog.ts`
- Kódy částí: `D001` až `D112`
- Znak se bere podle slug názvu části (např. `stare_mesto`)
- Fallback obrázek: `karlin`

Assety patří do `public/coats/`:
- `<district_slug>.webp` a volitelně `<district_slug>@2x.webp`
- `<district_slug>.png` a volitelně `<district_slug>@2x.png`

## Google OAuth setup

1. Vytvořte OAuth credentials v Google Cloud Console.
2. Přidejte redirecty:
   - JavaScript origin: `http://localhost:3000`
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Uložte do `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Restartujte dev server.

## Cloudflare R2 setup (privátní selfie)

1. V Cloudflare R2 vytvořte bucket (např. `praha112`).
2. Vytvořte API token s oprávněním číst/zapisovat do bucketu.
3. Doplňte do `.env`:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - volitelně `R2_ENDPOINT` (jinak se dopočítá z `R2_ACCOUNT_ID`)
4. Ověřte připojení:

```bash
npm run r2:smoke
```

Volitelné přepínače:

```bash
# ponechá testovací objekt v bucketu
npm run r2:smoke -- --keep

# explicitní bucket (přepíše R2_BUCKET_NAME z .env)
npm run r2:smoke -- --bucket praha112
```
