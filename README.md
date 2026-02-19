# Praha211 Web

Next.js 16 app with Prisma and PostgreSQL.

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
- `npm run prisma:migrate` - run local Prisma migrations
- `npm run prisma:push` - sync schema without migration files
- `npm run prisma:studio` - open Prisma Studio

## Structure

- `app/layout.tsx` - root HTML layout and metadata
- `app/page.tsx` - homepage
- `app/globals.css` - global styles
- `app/api/health/db/route.ts` - DB connectivity health endpoint
- `lib/prisma.ts` - Prisma client singleton
- `prisma/schema.prisma` - Prisma schema and models

## Database

- Default connection string is in `.env.example`.
- Test connectivity with `GET /api/health/db`.
