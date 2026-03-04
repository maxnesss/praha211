import { ClaimSubmissionStatus, Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { createApprovedDistrictClaim } from "@/lib/game/claim-submission-service";
import { getDistrictByCode } from "@/lib/game/district-catalog";
import {
  type LocalClaimValidationResult,
  validateDistrictSelfieLocally,
} from "@/lib/game/local-selfie-validation";
import { LEADERBOARD_CACHE_TAG } from "@/lib/game/queries";
import { prisma } from "@/lib/prisma";

export type PendingSubmissionState = "VALIDATING" | "MANUAL_REVIEW";

export const AUTO_VALIDATION_IN_PROGRESS_NOTE = "Probíhá automatická validace selfie.";

const AUTO_VALIDATION_APPROVED_NOTE = "Auto-schváleno lokální validací selfie.";
const AUTO_VALIDATION_MANUAL_REVIEW_NOTE =
  "Automatická validace nedokázala potvrdit ceduli, žádost čeká na ruční schválení.";
const AUTO_VALIDATION_RETRY_NOTE =
  "Automatická validace selhala interní chybou, pokus bude zopakován.";
const DEFAULT_VALIDATION_LOCK_STALE_MS = 10 * 60 * 1000;
const MIN_VALIDATION_LOCK_STALE_MS = 60 * 1000;
const MAX_VALIDATION_LOCK_STALE_MS = 24 * 60 * 60 * 1000;

function shouldBypassLocalValidationInCI() {
  return process.env.CI === "true";
}

function buildBypassedLocalValidation() {
  return {
    verdict: "PASS" as const,
    confidence: 1,
    faceDetected: true,
    faceCount: 1,
    districtNameMatched: true,
    matchedAlias: null,
    ocrText: "",
    reasons: ["Lokální validace byla přeskočena v CI režimu."],
  };
}

function getLocalValidationTimeoutMs() {
  const raw = process.env.LOCAL_SELFIE_VALIDATION_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(parsed) || parsed < 30_000) {
    return 90_000;
  }
  return parsed;
}

function getValidationLockStaleMs() {
  const raw = process.env.CLAIM_VALIDATION_LOCK_STALE_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;

  if (Number.isNaN(parsed)) {
    return DEFAULT_VALIDATION_LOCK_STALE_MS;
  }

  return Math.min(
    Math.max(parsed, MIN_VALIDATION_LOCK_STALE_MS),
    MAX_VALIDATION_LOCK_STALE_MS,
  );
}

function getValidationLockStaleThreshold(now: Date) {
  return new Date(now.getTime() - getValidationLockStaleMs());
}

function buildTimedOutLocalValidation(timeoutMs: number): LocalClaimValidationResult {
  return {
    verdict: "REVIEW",
    confidence: 0.3,
    faceDetected: false,
    faceCount: 0,
    districtNameMatched: false,
    matchedAlias: null,
    ocrText: "",
    reasons: [
      `Lokální validace selfie překročila časový limit (${Math.round(timeoutMs / 1000)} s).`,
      "Žádost byla přijata k ruční kontrole administrátorem.",
    ],
  };
}

async function runLocalValidationWithTimeout(
  input: { selfieUrl: string; districtName: string },
  timeoutMs: number,
) {
  const validationPromise = validateDistrictSelfieLocally(input).catch((error) => {
    console.error("Lokální validace selfie spadla do fallbacku:", error);
    return {
      verdict: "REVIEW",
      confidence: 0,
      faceDetected: false,
      faceCount: 0,
      districtNameMatched: false,
      matchedAlias: null,
      ocrText: "",
      reasons: [
        "Lokální validace selfie selhala interní chybou. Žádost čeká na ruční kontrolu.",
      ],
    } satisfies LocalClaimValidationResult;
  });

  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<LocalClaimValidationResult>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve(buildTimedOutLocalValidation(timeoutMs));
    }, timeoutMs);
  });

  const result = await Promise.race([validationPromise, timeoutPromise]);
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  return result;
}

export function getPendingSubmissionState(input: {
  localValidatedAt: Date | null;
  reviewNote: string | null;
}): PendingSubmissionState {
  if (
    input.localValidatedAt === null
    || input.reviewNote === AUTO_VALIDATION_IN_PROGRESS_NOTE
  ) {
    return "VALIDATING";
  }

  return "MANUAL_REVIEW";
}

export type ClaimValidationQueueResult = {
  scanned: number;
  locked: number;
  approved: number;
  manualReview: number;
  skipped: number;
  failed: number;
};

type QueueCandidate = {
  id: string;
  userId: string;
  districtCode: string;
  chapterSlug: string;
  districtName: string;
  selfieUrl: string;
  attestSignVisible: boolean;
  createdAt: Date;
};

async function approveSubmission(
  candidate: QueueCandidate,
  localValidation: LocalClaimValidationResult,
) {
  const now = new Date();
  const district = getDistrictByCode(candidate.districtCode);
  if (!district) {
    await prisma.districtClaimSubmission.update({
      where: { id: candidate.id },
      data: {
        localFaceCount: localValidation.faceCount,
        localFaceDetected: localValidation.faceDetected,
        localDistrictMatched: localValidation.districtNameMatched,
        localConfidence: localValidation.confidence,
        localMatchedAlias: localValidation.matchedAlias,
        localOcrText: localValidation.ocrText,
        localReasons: localValidation.reasons as Prisma.JsonArray,
        localValidatedAt: now,
        reviewNote: AUTO_VALIDATION_MANUAL_REVIEW_NOTE,
      },
    });
    return false;
  }

  const approved = await prisma.$transaction(async (tx) => {
    const current = await tx.districtClaimSubmission.findUnique({
      where: { id: candidate.id },
      select: {
        id: true,
        status: true,
        reviewNote: true,
      },
    });

    if (
      !current
      || current.status !== ClaimSubmissionStatus.PENDING
      || current.reviewNote !== AUTO_VALIDATION_IN_PROGRESS_NOTE
    ) {
      return null;
    }

    const existingClaim = await tx.districtClaim.findUnique({
      where: {
        userId_districtCode: {
          userId: candidate.userId,
          districtCode: candidate.districtCode,
        },
      },
      select: { id: true },
    });

    if (existingClaim) {
      await tx.districtClaimSubmission.update({
        where: { id: candidate.id },
        data: {
          status: ClaimSubmissionStatus.REJECTED,
          localFaceCount: localValidation.faceCount,
          localFaceDetected: localValidation.faceDetected,
          localDistrictMatched: localValidation.districtNameMatched,
          localConfidence: localValidation.confidence,
          localMatchedAlias: localValidation.matchedAlias,
          localOcrText: localValidation.ocrText,
          localReasons: localValidation.reasons as Prisma.JsonArray,
          localValidatedAt: now,
          reviewedAt: now,
          reviewNote: "Městská část už byla odemčena jinou žádostí.",
        },
      });
      return null;
    }

    const approvedClaim = await createApprovedDistrictClaim({
      tx,
      userId: candidate.userId,
      districtCode: candidate.districtCode,
      chapterSlug: candidate.chapterSlug,
      districtName: candidate.districtName,
      selfieUrl: candidate.selfieUrl,
      signVisible: candidate.attestSignVisible,
      claimedAt: candidate.createdAt,
      basePoints: district.basePoints,
    });

    await tx.districtClaimSubmission.update({
      where: { id: candidate.id },
      data: {
        status: ClaimSubmissionStatus.APPROVED,
        localFaceCount: localValidation.faceCount,
        localFaceDetected: localValidation.faceDetected,
        localDistrictMatched: localValidation.districtNameMatched,
        localConfidence: localValidation.confidence,
        localMatchedAlias: localValidation.matchedAlias,
        localOcrText: localValidation.ocrText,
        localReasons: localValidation.reasons as Prisma.JsonArray,
        localValidatedAt: now,
        reviewedAt: now,
        reviewNote: AUTO_VALIDATION_APPROVED_NOTE,
        approvedClaimId: approvedClaim.claim.id,
      },
    });

    return true;
  });

  if (approved) {
    revalidateTag(LEADERBOARD_CACHE_TAG, "max");
  }

  return Boolean(approved);
}

export async function processPendingClaimValidations(input?: {
  limit?: number;
}): Promise<ClaimValidationQueueResult> {
  const limit = Math.min(Math.max(input?.limit ?? 3, 1), 20);
  const scanStartedAt = new Date();
  const staleLockThreshold = getValidationLockStaleThreshold(scanStartedAt);
  const result: ClaimValidationQueueResult = {
    scanned: 0,
    locked: 0,
    approved: 0,
    manualReview: 0,
    skipped: 0,
    failed: 0,
  };

  const candidates = await prisma.districtClaimSubmission.findMany({
    where: {
      status: ClaimSubmissionStatus.PENDING,
      OR: [
        { localValidatedAt: null },
        {
          reviewNote: AUTO_VALIDATION_IN_PROGRESS_NOTE,
          localValidatedAt: { lte: staleLockThreshold },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      districtCode: true,
      chapterSlug: true,
      districtName: true,
      selfieUrl: true,
      attestSignVisible: true,
      createdAt: true,
    },
  });

  for (const candidate of candidates as QueueCandidate[]) {
    result.scanned += 1;
    const lockAttemptedAt = new Date();
    const lockStaleThreshold = getValidationLockStaleThreshold(lockAttemptedAt);

    const lock = await prisma.districtClaimSubmission.updateMany({
      where: {
        id: candidate.id,
        status: ClaimSubmissionStatus.PENDING,
        OR: [
          { localValidatedAt: null },
          {
            reviewNote: AUTO_VALIDATION_IN_PROGRESS_NOTE,
            localValidatedAt: { lte: lockStaleThreshold },
          },
        ],
      },
      data: {
        localValidatedAt: lockAttemptedAt,
        reviewNote: AUTO_VALIDATION_IN_PROGRESS_NOTE,
      },
    });

    if (lock.count === 0) {
      result.skipped += 1;
      continue;
    }

    result.locked += 1;

    try {
      const localValidation = shouldBypassLocalValidationInCI()
        ? buildBypassedLocalValidation()
        : await runLocalValidationWithTimeout(
          {
            selfieUrl: candidate.selfieUrl,
            districtName: candidate.districtName,
          },
          getLocalValidationTimeoutMs(),
        );

      if (localValidation.verdict === "PASS") {
        const approved = await approveSubmission(candidate, localValidation);
        if (approved) {
          result.approved += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }

      await prisma.districtClaimSubmission.updateMany({
        where: {
          id: candidate.id,
          status: ClaimSubmissionStatus.PENDING,
        },
        data: {
          localFaceCount: localValidation.faceCount,
          localFaceDetected: localValidation.faceDetected,
          localDistrictMatched: localValidation.districtNameMatched,
          localConfidence: localValidation.confidence,
          localMatchedAlias: localValidation.matchedAlias,
          localOcrText: localValidation.ocrText,
          localReasons: localValidation.reasons as Prisma.JsonArray,
          localValidatedAt: new Date(),
          reviewNote: AUTO_VALIDATION_MANUAL_REVIEW_NOTE,
        },
      });
      result.manualReview += 1;
    } catch (error) {
      console.error("Asynchronní validace selfie selhala:", error);
      result.failed += 1;

      await prisma.districtClaimSubmission.updateMany({
        where: {
          id: candidate.id,
          status: ClaimSubmissionStatus.PENDING,
        },
        data: {
          localValidatedAt: null,
          reviewNote: AUTO_VALIDATION_RETRY_NOTE,
        },
      });
    }
  }

  return result;
}
