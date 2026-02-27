# AGENTS.md

## Project

- Name: **PRAHA 112**
- Purpose: completion challenge for all 112 Prague cadastral districts.
- Core split:
  - Completion = finite (`112/112`)
  - Score = infinite (base points + same-day multiplier + streak bonus)

## Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL
- NextAuth (Credentials + Google)
- Zod validation

## Local setup

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

## Key scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:migrate:dev`
- `npm run prisma:studio`
- `npm run user:add -- --email ... --password ...`

## Auth and roles

- Roles: `ADMIN`, `USER`
- New users default to `USER`
- NextAuth routes:
  - `app/api/auth/[...nextauth]/route.ts`
  - `app/api/auth/register/route.ts`

## Game architecture

- District and chapter data source: `lib/game/district-catalog.ts`
- Overview/streak/scoring helpers: `lib/game/progress.ts`
- Claim endpoint: `app/api/districts/[code]/claim/route.ts`
- Rulebook V1 is trust-based (server-time submission, one claim per user+district)

## Coats of arms

- Place assets in `public/coats/`
- Expected naming is **slug-based** (not district code):
  - Example: `stare_mesto.png`, optional `stare_mesto.webp`
- UI fallback:
  - If district image is missing, `karlin` image is used as default fallback

## UI routes

- Main landing page (public): `/`
- Overview (requires login): `/overview`
- Chapter: `/chapter/[slug]`
- District detail/claim: `/district/[code]`
- Sign in: `/sign-in`
- Sign up: `/sign-up`

## Language and localization

- Default language is **Czech** (`cs`).
- All user-facing copy should be in Czech:
  - UI labels, buttons, headings, helper texts
  - form validation messages
  - API response messages surfaced in UI
- Keep technical identifiers in code as-is (`USER`, `ADMIN`, route paths, schema names).
- If adding new pages/layout metadata, keep `<html lang="cs">` and Czech metadata text.
- App flow rule: only the main landing page is public; game routes require login.

## Form autofill policy

- Disable browser autofill/autocomplete on all forms by default.
- Exception: keep autofill enabled on `sign-in` and `sign-up` forms.

## Data and migration notes

- Prisma schema: `prisma/schema.prisma`
- Keep migrations additive and committed under `prisma/migrations/`
- Canonical claim time is server-side `claimedAt`

## Validation and quality

- Always run before finishing work:
  - `npm run lint`
  - `npm run build`

## Current caveat

- District list uses 112 unique cadastral districts and includes `Újezd u Průhonic` (no duplicate `Kamýk` entry).
- Do not auto-correct product data unless explicitly requested.
