#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { syncUserScoreEvents } from "../lib/game/score-ledger.ts";

const prisma = new PrismaClient();
const BATCH_SIZE = 200;

async function main() {
  let cursorId = null;
  let processedUsers = 0;

  for (;;) {
    const users = await prisma.user.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursorId
        ? {
            cursor: { id: cursorId },
            skip: 1,
          }
        : {}),
    });

    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      await syncUserScoreEvents({
        db: prisma,
        userId: user.id,
      });
      processedUsers += 1;
    }

    cursorId = users[users.length - 1]?.id ?? null;
    console.log(`Backfill progress: ${processedUsers} users`);
  }

  console.log(`OK score events backfill completed for ${processedUsers} users.`);
}

main()
  .catch((error) => {
    console.error("Score events backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
