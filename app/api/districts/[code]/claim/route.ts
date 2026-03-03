import { ClaimSubmissionStatus, Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import { createApprovedDistrictClaim } from "@/lib/game/claim-submission-service";
import { getDistrictByCode } from "@/lib/game/district-catalog";
import { LEADERBOARD_CACHE_TAG } from "@/lib/game/queries";
import { validateDistrictSelfieLocally } from "@/lib/game/local-selfie-validation";
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

      const rateLimited = applyRateLimit({
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
          { message: "Pro tuto městskou část už čeká žádost na ruční schválení." },
          { status: 409 },
        );
      }

      const localValidation = shouldBypassLocalValidationInCI()
        ? buildBypassedLocalValidation()
        : await validateDistrictSelfieLocally({
          selfieUrl: selfieKey,
          districtName: district.name,
        });
      const now = new Date();

      if (localValidation.verdict === "PASS") {
        try {
          const result = await prisma.$transaction(async (tx) => {
            const submission = await tx.districtClaimSubmission.create({
              data: {
                userId,
                districtCode: district.code,
                chapterSlug: district.chapterSlug,
                districtName: district.name,
                selfieUrl: selfieKey,
                attestVisited: parsed.data.attestVisited,
                attestSignVisible: parsed.data.attestSignVisible,
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
                reviewNote: "Auto-schváleno lokální validací selfie.",
              },
              select: { id: true },
            });

            const approvedClaim = await createApprovedDistrictClaim({
              tx,
              userId,
              districtCode: district.code,
              chapterSlug: district.chapterSlug,
              districtName: district.name,
              selfieUrl: selfieKey,
              signVisible: parsed.data.attestSignVisible,
              claimedAt: now,
              basePoints: district.basePoints,
            });

            await tx.districtClaimSubmission.update({
              where: { id: submission.id },
              data: {
                approvedClaimId: approvedClaim.claim.id,
              },
            });

            return approvedClaim;
          });

          revalidateTag(LEADERBOARD_CACHE_TAG, "max");

          return NextResponse.json(
            {
              message: "Městská část byla úspěšně potvrzena (lokální validace selfie prošla).",
              claim: result.claim,
              streakAfterClaim: result.streakAfterClaim,
              validationMode: "auto",
            },
            { status: 201 },
          );
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError
            && error.code === "P2002"
          ) {
            return NextResponse.json(
              { message: "Tato městská část už byla potvrzena." },
              { status: 409 },
            );
          }

          console.error("Potvrzení městské části selhalo:", error);
          return NextResponse.json(
            { message: "Potvrzení městské části selhalo." },
            { status: 500 },
          );
        }
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
            localFaceCount: localValidation.faceCount,
            localFaceDetected: localValidation.faceDetected,
            localDistrictMatched: localValidation.districtNameMatched,
            localConfidence: localValidation.confidence,
            localMatchedAlias: localValidation.matchedAlias,
            localOcrText: localValidation.ocrText,
            localReasons: localValidation.reasons as Prisma.JsonArray,
            localValidatedAt: now,
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

        return NextResponse.json(
          {
            message:
              "Žádost byla přijata. Lokální kontrola nestačila na automatické odemčení, žádost čeká na ruční schválení administrátorem.",
            submission: {
              id: submission.id,
              createdAt: submission.createdAt,
            },
            validationMode: "manual_review",
          },
          { status: 202 },
        );
      } catch (error) {
        console.error("Uložení žádosti o potvrzení městské části selhalo:", error);
        return NextResponse.json(
          { message: "Nepodařilo se uložit žádost o potvrzení městské části." },
          { status: 500 },
        );
      }
    },
  );
}
