# PRAHA 112

Next.js 16 aplikace pro výzvu PRAHA 112.
Stack: Prisma + PostgreSQL + NextAuth (credentials + Google).

## Rychlý start

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Otevřete `http://localhost:3000`.

## Produktový model

- 7 kapitol x 16 městských částí = 112 celkem
- Dokončení je konečné (`112/112`)
- Skóre je nekonečné (základní body + násobitel za stejný den + bonus za sérii)
- Pravidla V1 jsou založená na důvěře:
  - vyžadována fyzická návštěva
  - oficiální cedule musí být vidět
  - povinné URL selfie
  - o dokončení rozhoduje serverový čas
  - každou městskou část lze potvrdit jen jednou na uživatele

## Skripty

- `npm run dev` - spustí vývojový server
- `npm run build` - vytvoří produkční build
- `npm run start` - spustí produkční server
- `npm run lint` - spustí eslint
- `npm run prisma:generate` - vygeneruje Prisma Client
- `npm run prisma:migrate` - aplikuje existující migrace
- `npm run prisma:migrate:dev` - vytvoří a aplikuje novou migraci (dev)
- `npm run prisma:push` - synchronizuje schéma bez migračních souborů
- `npm run prisma:studio` - otevře Prisma Studio
- `npm run user:add -- --email ... --password ...` - vytvoří uživatele přes CLI

## Struktura

- `app/layout.tsx` - kořenový HTML layout a metadata
- `app/page.tsx` - domovská stránka
- `app/chapter/[slug]/page.tsx` - stránka kapitoly s mřížkou 4x4
- `app/district/[code]/page.tsx` - detail městské části + odeslání potvrzení
- `app/globals.css` - globální styly
- `app/sign-in/page.tsx` - stránka přihlášení
- `app/sign-up/page.tsx` - stránka registrace
- `app/api/auth/[...nextauth]/route.ts` - handler pro NextAuth
- `app/api/auth/register/route.ts` - endpoint registrace
- `app/api/districts/[code]/claim/route.ts` - endpoint potvrzení městské části (trust-based)
- `app/api/health/db/route.ts` - health endpoint konektivity DB
- `lib/auth.ts` - konfigurace NextAuth (credentials + callbacky)
- `lib/game/praha112.ts` - definice kapitol a městských částí
- `lib/game/progress.ts` - helpery pro postup, sérii a bodování
- `lib/prisma.ts` - singleton Prisma clientu
- `prisma/schema.prisma` - Prisma schéma a modely

## Databáze

- Výchozí connection string je v `.env.example`.
- Konektivitu ověříte přes `GET /api/health/db`.
- Potvrzení se ukládají do `DistrictClaim` včetně rozpadů bodování.

## Auth a role

- Autentizace běží přes NextAuth (credentials + Google OAuth).
- Noví uživatelé se registrují na `/sign-up` a dostanou roli `USER`.
- Přihlášení je na `/sign-in`.
- Dostupné role: `ADMIN`, `USER`.
- Pro povýšení uživatele na admina spusťte SQL:

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'you@example.com';
```

- Nebo vytvářejte uživatele přímo přes CLI:

```bash
npm run user:add -- --email admin@praha211.com --password "AdminPass123" --role ADMIN --name "Admin User"
```

## Obsah městských částí

- Rozdělení kapitol a názvy městských částí jsou v `lib/game/praha112.ts`.
- Kódy městských částí jsou stabilní: `D001` až `D112`.
- Znak se dohledává podle slug názvu městské části (např. `stare_mesto.png`).
- Pokud znak chybí, UI automaticky použije fallback `karlin`.
- Assety znaků patří do `public/coats/`:
  - `<district_slug>.webp` a volitelně `<district_slug>@2x.webp`
  - `<district_slug>.png` a volitelně `<district_slug>@2x.png`

## Nastavení Google OAuth

1. Vytvořte OAuth přihlašovací údaje v Google Cloud Console.
2. Přidejte tyto redirect hodnoty:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Uložte údaje do `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Restartujte `npm run dev`.
