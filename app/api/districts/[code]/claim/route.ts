import { ClaimSubmissionStatus, Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import {
  getPendingSubmissionState,
  processPendingClaimValidations,
} from "@/lib/game/claim-validation-queue";
import { getDistrictByCode } from "@/lib/game/district-catalog";
import { LEADERBOARD_CACHE_TAG } from "@/lib/game/queries";
import { prisma } from "@/lib/prisma";
import { isSelfieObjectKey } from "@/lib/selfie-upload-rules";
import { doesR2ObjectExist } from "@/lib/storage/r2";
import { districtClaimSchema, getValidationMessage } from "@/lib/validation/game";

type ClaimRouteContext = {
  params: Promise<{ code: string }>;
};

function shouldBypassLocalValidationInCI() {
  return process.env.CI === "true";
}

function isSelfieOwnedByUser(selfieKey: string, userId: string) {
  return selfieKey.startsWith(`selfies/${userId}/`);
}

export async function POST(request: Request, context: ClaimRouteContext) {
  return withApiWriteObservability(
    { request, operation: "district.claim" },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
      }

      const userStatus = await prisma.user.findUnique({
        where: { id: userId },
        select: { isFrozen: true },
      });

      if (userStatus?.isFrozen) {
        return NextResponse.json(
          { message: "Váš účet je zmrazený. Kontaktujte prosím podporu." },
          { status: 403 },
        );
      }

      const rateLimited = await applyRateLimit({
        request,
        prefix: "district-claim",
        userId,
        max: 30,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho potvrzení v krátkém čase. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
      }

      const { code } = await context.params;
      const district = getDistrictByCode(code);

      if (!district) {
        return NextResponse.json(
          { message: "Městská část nebyla nalezena." },
          { status: 404 },
        );
      }

      let body: unknown;
      try {
        body = (await request.json()) as unknown;
      } catch {
        return NextResponse.json(
          { message: "Neplatné tělo požadavku." },
          { status: 400 },
        );
      }

      const parsed = districtClaimSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: getValidationMessage(parsed.error) },
          { status: 400 },
        );
      }

      const selfieKey = parsed.data.selfieUrl.trim();
      if (!isSelfieObjectKey(selfieKey)) {
        return NextResponse.json(
          { message: "Selfie musí být interní klíč úložiště." },
          { status: 400 },
        );
      }

      if (!isSelfieOwnedByUser(selfieKey, userId)) {
        return NextResponse.json(
          { message: "Selfie nepatří aktuálnímu uživateli." },
          { status: 403 },
        );
      }

      if (!shouldBypassLocalValidationInCI()) {
        try {
          const exists = await doesR2ObjectExist(selfieKey);
          if (!exists) {
            return NextResponse.json(
              { message: "Selfie nebyla nalezena." },
              { status: 404 },
            );
          }
        } catch (error) {
          console.error("Ověření selfie v R2 selhalo:", error);
          return NextResponse.json(
            { message: "Nepodařilo se ověřit selfie." },
            { status: 500 },
          );
        }
      }

      const [existingClaim, existingPendingSubmission] = await Promise.all([
        prisma.districtClaim.findUnique({
          where: {
            userId_districtCode: {
              userId,
              districtCode: district.code,
            },
          },
          select: { id: true },
        }),
        prisma.districtClaimSubmission.findFirst({
          where: {
            userId,
            districtCode: district.code,
            status: ClaimSubmissionStatus.PENDING,
          },
          select: { id: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      if (existingClaim) {
        return NextResponse.json(
          { message: "Tato městská část už byla potvrzena." },
          { status: 409 },
        );
      }

      if (existingPendingSubmission) {
        return NextResponse.json(
          { message: "Pro tuto městskou část už probíhá validace nebo čeká žádost." },
          { status: 409 },
        );
      }

      try {
        const submission = await prisma.districtClaimSubmission.create({
          data: {
            userId,
            districtCode: district.code,
            chapterSlug: district.chapterSlug,
            districtName: district.name,
            selfieUrl: selfieKey,
            attestVisited: parsed.data.attestVisited,
            attestSignVisible: parsed.data.attestSignVisible,
            status: ClaimSubmissionStatus.PENDING,
            localFaceCount: 0,
            localFaceDetected: false,
            localDistrictMatched: false,
            localConfidence: 0,
            localMatchedAlias: null,
            localOcrText: null,
            localReasons: [] as Prisma.JsonArray,
            localValidatedAt: null,
            reviewNote: null,
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

        if (shouldBypassLocalValidationInCI()) {
          await processPendingClaimValidations({ limit: 1 });
          const approvedClaim = await prisma.districtClaim.findUnique({
            where: {
              userId_districtCode: {
                userId,
                districtCode: district.code,
              },
            },
            select: {
              id: true,
              districtCode: true,
              districtName: true,
              chapterSlug: true,
              claimedAt: true,
              selfieUrl: true,
            },
          });

          if (approvedClaim) {
            revalidateTag(LEADERBOARD_CACHE_TAG, "max");
            return NextResponse.json(
              {
                message: "Městská část byla úspěšně potvrzena (lokální validace selfie prošla).",
                claim: approvedClaim,
                validationMode: "auto",
              },
              { status: 201 },
            );
          }
        } else {
          void processPendingClaimValidations({ limit: 1 }).catch((error) => {
            console.error("Spuštění asynchronní validace po enqueue selhalo:", error);
          });
        }

        return NextResponse.json(
          {
            message:
              "Selfie byla přijata. Probíhá automatická validace, výsledek se brzy projeví.",
            submission: {
              id: submission.id,
              createdAt: submission.createdAt,
            },
            validationMode: "queued",
          },
          { status: 202 },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === "P2002"
        ) {
          return NextResponse.json(
            { message: "Pro tuto městskou část už probíhá validace nebo čeká žádost." },
            { status: 409 },
          );
        }

        console.error("Uložení žádosti o potvrzení městské části selhalo:", error);
        return NextResponse.json(
          { message: "Nepodařilo se uložit žádost o potvrzení městské části." },
          { status: 500 },
        );
      }
    },
  );
}

export async function GET(_request: Request, context: ClaimRouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const { code } = await context.params;
  const district = getDistrictByCode(code);

  if (!district) {
    return NextResponse.json(
      { message: "Městská část nebyla nalezena." },
      { status: 404 },
    );
  }

  const [claim, pendingSubmission] = await Promise.all([
    prisma.districtClaim.findUnique({
      where: {
        userId_districtCode: {
          userId,
          districtCode: district.code,
        },
      },
      select: {
        id: true,
        claimedAt: true,
      },
    }),
    prisma.districtClaimSubmission.findFirst({
      where: {
        userId,
        districtCode: district.code,
        status: ClaimSubmissionStatus.PENDING,
      },
      select: {
        id: true,
        createdAt: true,
        localValidatedAt: true,
        reviewNote: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (claim) {
    return NextResponse.json(
      {
        status: "CLAIMED" as const,
        claim: {
          id: claim.id,
          claimedAt: claim.claimedAt,
        },
      },
      { status: 200 },
    );
  }

  if (pendingSubmission) {
    return NextResponse.json(
      {
        status: "PENDING" as const,
        submission: {
          id: pendingSubmission.id,
          createdAt: pendingSubmission.createdAt,
          pendingState: getPendingSubmissionState({
            localValidatedAt: pendingSubmission.localValidatedAt,
            reviewNote: pendingSubmission.reviewNote,
          }),
        },
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ status: "NONE" as const }, { status: 200 });
}
