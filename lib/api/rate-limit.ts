import { NextResponse } from "next/server";

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
};

const globalState = globalThis as RateLimitGlobal;
const rateLimitStore = globalState.__praha112RateLimitStore ?? new Map<string, RateLimitStoreEntry>();

if (!globalState.__praha112RateLimitStore) {
  globalState.__praha112RateLimitStore = rateLimitStore;
}

const DEFAULT_RATE_LIMIT_MESSAGE = "Příliš mnoho požadavků. Zkuste to prosím za chvíli znovu.";
const STORE_SOFT_LIMIT = 5000;

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

export function applyRateLimit(input: ApplyRateLimitInput) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const identity = input.userId
    ? `user:${input.userId}`
    : `ip:${getClientIp(input.request)}`;
  const key = `${input.prefix}:${identity}`;
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

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return null;
}
