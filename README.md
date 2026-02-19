# Praha211 Web

Next.js 16 app with Prisma, PostgreSQL, and NextAuth credentials auth.

## Quick start

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Open `http://localhost:3000`.

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
- `app/globals.css` - global styles
- `app/sign-in/page.tsx` - sign-in page
- `app/sign-up/page.tsx` - sign-up page
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handler
- `app/api/auth/register/route.ts` - registration endpoint
- `app/api/health/db/route.ts` - DB connectivity health endpoint
- `lib/auth.ts` - NextAuth config (credentials + callbacks)
- `lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Prisma schema and models

## Database

- Default connection string is in `.env.example`.
- Test connectivity with `GET /api/health/db`.

## Auth and roles

- Auth uses email/password with NextAuth credentials provider.
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
