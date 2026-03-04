import { ClaimSubmissionStatus, Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { authOptions } from "@/lib/auth";
import { createApprovedDistrictClaim } from "@/lib/game/claim-submission-service";
import { getDistrictByCode } from "@/lib/game/district-catalog";
import { LEADERBOARD_CACHE_TAG } from "@/lib/game/queries";
import { prisma } from "@/lib/prisma";

const updateSubmissionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(600).optional(),
});

type UpdateSubmissionRouteContext = {
  params: Promise<{ submissionId: string }>;
};

class SubmissionHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request, context: UpdateSubmissionRouteContext) {
  return withApiWriteObservability(
    { request, operation: "admin.claim_submission.update" },
    async () => {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
      }

      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Přístup odepřen." }, { status: 403 });
      }

      const rateLimited = await applyRateLimit({
        request,
        prefix: "admin-claim-submission-update",
        userId,
        max: 90,
        windowMs: 5 * 60 * 1000,
        message: "Příliš mnoho administrátorských požadavků. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
      }

      let body: unknown;
      try {
        body = (await request.json()) as unknown;
      } catch {
        return NextResponse.json({ message: "Neplatné tělo požadavku." }, { status: 400 });
      }

      const parsed = updateSubmissionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ message: "Neplatný požadavek." }, { status: 400 });
      }

      const { submissionId } = await context.params;
      if (!submissionId.trim()) {
        return NextResponse.json({ message: "Chybí ID validace." }, { status: 400 });
      }

      if (parsed.data.action === "reject") {
        const existing = await prisma.districtClaimSubmission.findUnique({
          where: { id: submissionId },
          select: {
            id: true,
            status: true,
          },
        });

        if (!existing) {
          return NextResponse.json({ message: "Žádost nebyla nalezena." }, { status: 404 });
        }

        if (existing.status !== ClaimSubmissionStatus.PENDING) {
          return NextResponse.json(
            { message: "Tato žádost už byla zpracována." },
            { status: 409 },
          );
        }

        await prisma.districtClaimSubmission.update({
          where: { id: submissionId },
          data: {
            status: ClaimSubmissionStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedByUserId: userId,
            reviewNote: parsed.data.note || "Žádost zamítnuta administrátorem.",
          },
        });

        return NextResponse.json({
          message: "Žádost byla zamítnuta.",
        });
      }

      try {
        const now = new Date();
        const result = await prisma.$transaction(async (tx) => {
          const submission = await tx.districtClaimSubmission.findUnique({
            where: { id: submissionId },
            select: {
              id: true,
              userId: true,
              districtCode: true,
              chapterSlug: true,
              districtName: true,
              selfieUrl: true,
              attestSignVisible: true,
              createdAt: true,
              status: true,
            },
          });

          if (!submission) {
            throw new SubmissionHttpError(404, "Žádost nebyla nalezena.");
          }

          if (submission.status !== ClaimSubmissionStatus.PENDING) {
            throw new SubmissionHttpError(409, "Tato žádost už byla zpracována.");
          }

          const district = getDistrictByCode(submission.districtCode);
          if (!district) {
            throw new SubmissionHttpError(400, "Žádost obsahuje neplatný district.");
          }

          const existingClaim = await tx.districtClaim.findUnique({
            where: {
              userId_districtCode: {
                userId: submission.userId,
                districtCode: submission.districtCode,
              },
            },
            select: { id: true },
          });

          if (existingClaim) {
            throw new SubmissionHttpError(409, "Městská část už byla u uživatele odemčena.");
          }

          const approved = await createApprovedDistrictClaim({
            tx,
            userId: submission.userId,
            districtCode: submission.districtCode,
            chapterSlug: submission.chapterSlug,
            districtName: submission.districtName,
            selfieUrl: submission.selfieUrl,
            signVisible: submission.attestSignVisible,
            claimedAt: submission.createdAt,
            basePoints: district.basePoints,
          });

          const updatedSubmission = await tx.districtClaimSubmission.update({
            where: { id: submission.id },
            data: {
              status: ClaimSubmissionStatus.APPROVED,
              reviewedAt: now,
              reviewedByUserId: userId,
              reviewNote: parsed.data.note || "Žádost schválena administrátorem.",
              approvedClaimId: approved.claim.id,
            },
            select: {
              id: true,
              districtName: true,
            },
          });

          return {
            submission: updatedSubmission,
            claim: approved.claim,
          };
        });

        revalidateTag(LEADERBOARD_CACHE_TAG, "max");

        return NextResponse.json({
          message: `Žádost byla schválena: ${result.submission.districtName}.`,
          claim: result.claim,
        });
      } catch (error) {
        if (error instanceof SubmissionHttpError) {
          return NextResponse.json({ message: error.message }, { status: error.status });
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === "P2002"
        ) {
          return NextResponse.json(
            { message: "Městská část už byla odemčena." },
            { status: 409 },
          );
        }

        console.error("Schválení žádosti o odemčení selhalo:", error);
        return NextResponse.json(
          { message: "Schválení žádosti selhalo." },
          { status: 500 },
        );
      }
    },
  );
}
