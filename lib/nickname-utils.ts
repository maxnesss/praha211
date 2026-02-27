import { prisma } from "@/lib/prisma";

const MAX_NICKNAME_LENGTH = 40;

function toBaseNickname(input: string) {
  return input.trim().slice(0, MAX_NICKNAME_LENGTH);
}

function toCandidate(base: string, attempt: number) {
  if (attempt === 0) {
    return base;
  }

  const suffix = `-${attempt + 1}`;
  const clippedBase = base.slice(0, Math.max(1, MAX_NICKNAME_LENGTH - suffix.length));
  return `${clippedBase}${suffix}`;
}

export async function isNicknameTaken(nickname: string, excludeUserId?: string) {
  const normalized = nickname.trim();
  if (!normalized) {
    return false;
  }

  const existing = await prisma.user.findFirst({
    where: {
      nickname: {
        equals: normalized,
        mode: "insensitive",
      },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function generateUniqueNickname(
  preferred: string | null | undefined,
  excludeUserId?: string,
) {
  const preferredValue = preferred?.trim();
  if (!preferredValue) {
    return null;
  }

  const base = toBaseNickname(preferredValue);
  if (!base) {
    return null;
  }

  for (let attempt = 0; attempt < 400; attempt += 1) {
    const candidate = toCandidate(base, attempt);
    const taken = await isNicknameTaken(candidate, excludeUserId);
    if (!taken) {
      return candidate;
    }
  }

  const fallbackSuffix = Date.now().toString(36).slice(-6);
  const clippedBase = base.slice(0, Math.max(1, MAX_NICKNAME_LENGTH - fallbackSuffix.length - 1));
  return `${clippedBase}-${fallbackSuffix}`;
}
