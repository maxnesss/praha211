import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitStoreEntry = {
  count: number;
  resetAt: number;
};

type ApplyRateLimitInput = {
  request: Request;
  prefix: string;
  max: number;
  windowMs: number;
  userId?: string;
  message?: string;
};

type RateLimitGlobal = typeof globalThis & {
  __praha112RateLimitStore?: Map<string, RateLimitStoreEntry>;
  __praha112RateLimitCleanupAt?: number;
  __praha112RateLimitDbErrorLoggedAt?: number;
};

const globalState = globalThis as RateLimitGlobal;
const rateLimitStore = globalState.__praha112RateLimitStore ?? new Map<string, RateLimitStoreEntry>();

if (!globalState.__praha112RateLimitStore) {
  globalState.__praha112RateLimitStore = rateLimitStore;
}

const DEFAULT_RATE_LIMIT_MESSAGE = "Příliš mnoho požadavků. Zkuste to prosím za chvíli znovu.";
const STORE_SOFT_LIMIT = 5000;
const DB_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const DB_ENTRY_TTL_BUFFER_MS = 24 * 60 * 60 * 1000;
const DB_ERROR_LOG_INTERVAL_MS = 60 * 1000;

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function cleanupExpiredEntries(now: number) {
  if (rateLimitStore.size < STORE_SOFT_LIMIT) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function toResetAtMs(value: bigint | number | string) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function createRateLimitedResponse(input: ApplyRateLimitInput, retryAfterSeconds: number) {
  return NextResponse.json(
    { message: input.message ?? DEFAULT_RATE_LIMIT_MESSAGE },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

function applyRateLimitFromMemory(input: ApplyRateLimitInput, key: string) {
  const now = Date.now();
  cleanupExpiredEntries(now);
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return null;
  }

  if (entry.count >= input.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return createRateLimitedResponse(input, retryAfterSeconds);
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return null;
}

async function cleanupDbBucketsIfNeeded(now: number) {
  const lastCleanupAt = globalState.__praha112RateLimitCleanupAt ?? 0;
  if (now - lastCleanupAt < DB_CLEANUP_INTERVAL_MS) {
    return;
  }

  globalState.__praha112RateLimitCleanupAt = now;
  const cutoff = new Date(now - DB_ENTRY_TTL_BUFFER_MS);

  await prisma.$executeRaw`
    DELETE FROM "RateLimitBucket"
    WHERE "resetAt" < ${cutoff}
  `;
}

type RateLimitBucketRow = {
  count: number;
  resetAtMs: bigint | number | string;
};

async function applyRateLimitInDb(input: ApplyRateLimitInput, key: string) {
  const now = Date.now();
  const nextResetAtMs = now + input.windowMs;
  await cleanupDbBucketsIfNeeded(now);

  const rows = await prisma.$queryRaw<RateLimitBucketRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "createdAt", "updatedAt")
    VALUES (
      ${key},
      1,
      to_timestamp(${nextResetAtMs}::double precision / 1000.0),
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= CURRENT_TIMESTAMP THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= CURRENT_TIMESTAMP
          THEN to_timestamp(${nextResetAtMs}::double precision / 1000.0)
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING
      "count",
      FLOOR(EXTRACT(EPOCH FROM "resetAt") * 1000)::bigint AS "resetAtMs"
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  if (row.count <= input.max) {
    return null;
  }

  const resetAtMs = toResetAtMs(row.resetAtMs);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
  return createRateLimitedResponse(input, retryAfterSeconds);
}

function maybeLogRateLimitDbError(error: unknown) {
  const now = Date.now();
  const lastLoggedAt = globalState.__praha112RateLimitDbErrorLoggedAt ?? 0;
  if (now - lastLoggedAt < DB_ERROR_LOG_INTERVAL_MS) {
    return;
  }

  globalState.__praha112RateLimitDbErrorLoggedAt = now;
  console.error("Rate limiting v databázi selhal, používám fallback v paměti procesu:", error);
}

export async function applyRateLimit(input: ApplyRateLimitInput) {
  const identity = input.userId
    ? `user:${input.userId}`
    : `ip:${getClientIp(input.request)}`;
  const key = `${input.prefix}:${identity}`;

  try {
    return await applyRateLimitInDb(input, key);
  } catch (error) {
    maybeLogRateLimitDbError(error);
    return applyRateLimitFromMemory(input, key);
  }
}
