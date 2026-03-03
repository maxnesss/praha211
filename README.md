# PRAHA 112

Webová hra pro dokončení všech 112 pražských katastrálních území, se systémem bodů, denní série, týmů a žebříčku hráčů.

Stack:
- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth (Credentials)
- Zod

## Rychlý start

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Aplikace běží na `http://localhost:3000`.
Produkční doména: `https://www.praha112.cz`.

## Herní model

- 7 kapitol x 16 městských částí = 112 cílů
- Dokončení je konečné (`112/112`)
- Skóre je centrální přes event ledger (`ScoreEvent`)
- Aktivní bodovací eventy (V1):
  - `DISTRICT_CLAIM` (jednorázově za část)
  - `CHAPTER_COMPLETE` (+750 za kompletní kapitolu)
  - `PRAHA_PART_COMPLETE` (+300 za kompletní odznak Praha 1-22)
- Výpočet pro `DISTRICT_CLAIM`:
  - `awardedPoints = round(basePoints * sameDayMultiplier + streakBonus)`
  - `sameDayMultiplier = min(2, 1 + claimsTodayBefore * 0.15)`
  - `streakBonus = streakAfterClaim * 5`
- Aktuální pravidlo V1:
  - claim je 1× na uživatele + část, takže současná sada eventů je prakticky konečná
- Roadmapa pro nekonečný model (navazuje na `ScoreEvent`):
  - přidat opakovatelné eventy (např. denní/týdenní výzvy) s unikátními časovými klíči
  - rozšířit `/skore` o timeline podle eventů místo čistě podle claimů
  - držet žebříček nad součtem `ScoreEvent.points` (již implementováno)
- Pravidla V1 jsou trust-based:
  - hráč potvrzuje fyzickou návštěvu
  - hráč potvrzuje viditelnost oficiální cedule
  - claim používá serverový čas (`Europe/Prague`)
  - 1 uživatel může potvrdit danou část pouze jednou

## Hlavní funkce

- Přihlášení přes e-mail/heslo
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
- `npm run test` - jednotný běh všech integračních testů
- `npm run lint` - ESLint
- `npm run prisma:generate` - generování Prisma Clientu
- `npm run prisma:migrate` - aplikace existujících migrací
- `npm run prisma:migrate:dev` - vytvoření + aplikace nové migrace (dev)
- `npm run prisma:push` - push schématu bez migračních souborů
- `npm run prisma:studio` - Prisma Studio
- `npm run score:backfill` - jednorázová synchronizace `ScoreEvent` z existujících claimů
- `npm run user:add -- --email ... --password ...` - přidání uživatele přes CLI
- `npm run user:remove:remote -- --email ... [--dry-run] [--yes]` - smazání uživatele na remote DB podle e-mailu
- `npm run users:seed:random -- [parametry]` - seed náhodných uživatelů
- `npm run r2:smoke` - ověření Cloudflare R2 (1 upload + 1 download + verifikace + delete)
- `npm run test:integration:core` - integrační API test hlavních flow (auth + claim + selfie ownership + týmy)
- `npm run test:leaderboard:tie` - regresní test řazení žebříčku při shodě bodů
- `npm run test:teams:concurrency` - souběžné testy týmových operací (apply/approve)
- `npm run test:integration:all` - agregovaný běh všech testů (`core + leaderboard tie + teams concurrency`)

## Testy

Doporučený postup lokálně:

```bash
npm run prisma:migrate
npm run score:backfill
npm run test
```

Poznámky:
- Po nasazení migrace `ScoreEvent` spusťte `npm run score:backfill`, aby historická data dostala chapter/praha bonus eventy konzistentně.
- `test:integration:core` spouští produkční server (`npm run start`) na dočasném portu a testuje API end-to-end.
- Testy pracují s DB přes izolovaný namespace a po doběhu po sobě uklízí testovací data.
- V CI (GitHub Actions) se automaticky spouští `lint`, `build` a `test:integration:all`.

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
- `/radnice` - přehled hráče
- `/ochrana-osobnich-udaju` - zásady ochrany osobních údajů (GDPR)
- `/chapter/[slug]` - kapitola
- `/district/[code]` - detail městské části
- `/skore` - skóre
- `/pokladnice` - odznaky
- `/kniha-hrdinu` - rychlý žebříček
- `/kniha-hrdinu/list` - kompletní žebříček (stránkovaný)
- `/tym` - seznam týmů + vytvoření týmu
- `/tym/[slug]` - detail týmu
- `/player/[userId]` - veřejný profil hráče
- `/profile` - nastavení účtu
- `/sign-in` - přihlášení
- `/sign-up` - registrace

API:
- `/api/auth/[...nextauth]`
- `/api/auth/register`
- `/api/auth/verify-email`
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
- `ScoreEvent`
- `Team`
- `TeamJoinRequest`

Poznámky:
- `nickname` je unikátní
- claim je unikátní přes `(userId, districtCode)`
- týmové žádosti jsou unikátní přes `(teamId, userId)`

## Bezpečnost a API poznámky

- Veřejně volatelné write/mutate endpointy mají explicitní rate limiting (viz přehled níže).
- Claim endpoint ošetřuje závodní stav (duplicate claim) a vrací konzistentní `409`.
- Health endpoint (`/api/health/db`) je v produkci chráněn hlavičkou `x-health-check-secret` (`HEALTHCHECK_SECRET` v env).
  - Příklad: `curl -H "x-health-check-secret: <HEALTHCHECK_SECRET>" https://.../api/health/db`
- Selfie se ukládají privátně do Cloudflare R2:
  - klient si vyžádá podepsaný upload URL (`/api/uploads/selfie/sign`)
  - do DB se ukládá klíč objektu (`selfies/...`), ne veřejná URL
  - zobrazení probíhá přes podepsaný download URL (`/api/uploads/selfie/view`)

### API limity (write/mutate)

- `POST /api/auth/register`: `6 / 15 min` (IP)
- `GET /api/auth/verify-email`: `40 / 15 min` (IP)
- `POST /api/contact`: `8 / 10 min` (IP)
- `POST /api/districts/[code]/claim`: `30 / 5 min` (uživatel)
- `POST /api/profile/password`: `8 / 60 min` (uživatel)
- `POST /api/profile/nickname`: `8 / 10 min` (uživatel)
- `POST /api/profile/avatar`: `12 / 10 min` (uživatel)
- `POST /api/teams`: `5 / 60 min` (uživatel)
- `POST /api/teams/[slug]/apply`: `20 / 10 min` (uživatel)
- `POST /api/teams/[slug]/leave`: `8 / 5 min` (uživatel)
- `POST /api/teams/[slug]/members/[memberId]/remove`: `15 / 5 min` (uživatel)
- `POST /api/teams/[slug]/requests/[requestId]/approve`: `20 / 5 min` (uživatel)
- `POST /api/teams/[slug]/requests/[requestId]/reject`: `20 / 5 min` (uživatel)

## Auth a role

- Role: `USER`, `ADMIN`
- Noví uživatelé defaultně dostávají `USER`
- Registrace vyžaduje potvrzení zásad ochrany osobních údajů (GDPR)
- Po registraci je nutné potvrdit e-mail přes odkaz zaslaný přes Resend (`RESEND_API_KEY`, `RESEND_FROM`)
- Po úspěšném ověření e-mailu se odesílá uvítací e-mail
- Kontaktní formulář (`/kontaktujte-nas`) posílá zprávy přes Resend na `RESEND_CONTACT_TO` (pokud není nastaveno, použije adresu z `RESEND_FROM`)
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

## Deploy na VPS

Jednorázový bootstrap (na serveru):
- nainstalovat `postgresql`, `nginx`, `pm2`, `certbot`
- naklonovat repo do `/home/maxim/apps/praha211`
- vytvořit `.env` s produkčními hodnotami
- spustit aplikaci přes PM2 a proxy přes nginx

Další release:

```bash
git push origin main
npm run deploy:vps
```

Použití s explicitním hostem/brančí:

```bash
bash scripts/deploy-vps.sh praha112 main
```

Poznámky:
- Lokální deploy skript spouští vzdálený `scripts/deploy-remote.sh`.
- Remote deploy dělá `git pull --ff-only`, `npm ci`, `prisma:migrate`, `score:backfill`, `build`, `pm2 reload` a health check.
- Pokud je na serveru dirty worktree, deploy se bezpečně zastaví.
- V produkčním `.env` musí být:
  - `NEXTAUTH_URL=https://www.praha112.cz`
  - `NEXT_PUBLIC_SITE_URL=https://www.praha112.cz`
