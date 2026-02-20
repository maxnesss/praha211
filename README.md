# PRAHA 112

Next.js 16 app for the Praha 112 completion challenge.
Stack: Prisma + PostgreSQL + NextAuth (credentials + Google).

## Quick start

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Open `http://localhost:3000`.

## Product model

- 7 chapters × 16 districts = 112 total
- Completion is finite (`112/112`)
- Score is infinite (base points + same-day multiplier + streak bonus)
- Rulebook V1 is trust-based:
  - physical visit required
  - official sign visible
  - selfie URL required
  - server time defines completion
  - each district can be claimed once per user

## Scripts

- `npm run dev` - start dev server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run eslint
- `npm run prisma:generate` - generate Prisma Client
- `npm run prisma:migrate` - apply existing migrations
- `npm run prisma:migrate:dev` - create and apply a new migration (dev)
- `npm run prisma:push` - sync schema without migration files
- `npm run prisma:studio` - open Prisma Studio
- `npm run user:add -- --email ... --password ...` - create a user from CLI

## Structure

- `app/layout.tsx` - root HTML layout and metadata
- `app/page.tsx` - homepage
- `app/chapter/[slug]/page.tsx` - chapter page with 4x4 district grid
- `app/district/[code]/page.tsx` - district detail + claim submission
- `app/globals.css` - global styles
- `app/sign-in/page.tsx` - sign-in page
- `app/sign-up/page.tsx` - sign-up page
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `app/api/auth/register/route.ts` - registration endpoint
- `app/api/districts/[code]/claim/route.ts` - trust-based district claim endpoint
- `app/api/health/db/route.ts` - DB connectivity health endpoint
- `lib/auth.ts` - NextAuth config (credentials + callbacks)
- `lib/game/praha112.ts` - chapter and district definitions
- `lib/game/progress.ts` - progress, streak, and scoring helpers
- `lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Prisma schema and models

## Database

- Default connection string is in `.env.example`.
- Test connectivity with `GET /api/health/db`.
- Claims are stored in `DistrictClaim` with score components persisted per submission.

## Auth and roles

- Auth uses NextAuth with credentials and Google OAuth provider.
- New users can sign up at `/sign-up` and are assigned role `USER`.
- Sign in at `/sign-in`.
- Roles available: `ADMIN`, `USER`.
- To promote a user to admin, run SQL:

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'you@example.com';
```

- Or create users directly from CLI:

```bash
npm run user:add -- --email admin@praha211.com --password "AdminPass123" --role ADMIN --name "Admin User"
```

## District content

- Chapter groupings and district names are configured in `lib/game/praha112.ts`.
- District codes stay stable as `D001` to `D112`.
- Coat lookup uses district-name slugs (e.g. `stare_mesto.png`).
- If a district coat is missing, the UI automatically falls back to `karlin`.
- Coat assets are expected in `public/coats/`:
  - `<district_slug>.webp` and optional `<district_slug>@2x.webp`
  - `<district_slug>.png` and optional `<district_slug>@2x.png`

## Google OAuth setup

1. Create OAuth credentials in Google Cloud Console.
2. Add these redirect values:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Put credentials in `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Restart `npm run dev`.
