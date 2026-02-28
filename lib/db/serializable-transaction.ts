import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SerializableCallback<T> = (tx: Prisma.TransactionClient) => Promise<T>;

type SerializableRetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
};

const SERIALIZATION_CONFLICT_CODE = "P2034";
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 40;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isSerializableConflictError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === SERIALIZATION_CONFLICT_CODE
  );
}

export async function runSerializableTransactionWithRetry<T>(
  callback: SerializableCallback<T>,
  options?: SerializableRetryOptions,
) {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const baseDelayMs = Math.max(0, options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isSerializableConflictError(error) || attempt >= maxAttempts) {
        throw error;
      }

      const jitterMs = Math.floor(Math.random() * 25);
      await sleep(baseDelayMs * attempt + jitterMs);
    }
  }

  throw new Error("SERIALIZABLE_TRANSACTION_RETRY_EXHAUSTED");
}
