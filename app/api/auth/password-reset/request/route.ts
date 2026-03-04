import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  getFirstZodErrorMessage,
  passwordResetRequestSchema,
} from "@/lib/validation/auth";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "auth.password_reset.request" },
    async () => {
      const rateLimited = applyRateLimit({
        request,
        prefix: "password-reset-request",
        max: 6,
        windowMs: 15 * 60 * 1000,
        message: "Příliš mnoho pokusů. Zkuste to prosím později.",
      });
      if (rateLimited) {
        return rateLimited;
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

      const parsed = passwordResetRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: getFirstZodErrorMessage(parsed.error) },
          { status: 400 },
        );
      }

      const { email } = parsed.data;
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      if (user) {
        const resetToken = createPasswordResetToken();

        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetTokenHash: resetToken.tokenHash,
            passwordResetTokenExpiresAt: resetToken.expiresAt,
          },
        });

        try {
          await sendPasswordResetEmail({
            email: user.email,
            token: resetToken.token,
          });
        } catch (error) {
          console.error("Odeslání reset e-mailu selhalo:", error);
        }
      }

      return NextResponse.json(
        {
          message:
            "Pokud účet existuje, poslali jsme odkaz pro reset hesla na zadaný e-mail.",
        },
        { status: 200 },
      );
    },
  );
}
