import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { hashPasswordResetToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  getFirstZodErrorMessage,
  passwordResetConfirmSchema,
} from "@/lib/validation/auth";

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "auth.password_reset.confirm" },
    async () => {
      const rateLimited = await applyRateLimit({
        request,
        prefix: "password-reset-confirm",
        max: 10,
        windowMs: 10 * 60 * 1000,
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

      const parsed = passwordResetConfirmSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: getFirstZodErrorMessage(parsed.error) },
          { status: 400 },
        );
      }

      const { email, token, password } = parsed.data;
      const tokenHash = hashPasswordResetToken(token);

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          passwordResetTokenHash: true,
          passwordResetTokenExpiresAt: true,
        },
      });

      const tokenMatches =
        user?.passwordResetTokenHash
        && user.passwordResetTokenHash === tokenHash;
      const tokenNotExpired =
        user?.passwordResetTokenExpiresAt
        && user.passwordResetTokenExpiresAt.getTime() > Date.now();

      if (!tokenMatches || !tokenNotExpired || !user) {
        return NextResponse.json(
          { message: "Odkaz pro reset hesla je neplatný nebo expirovaný." },
          { status: 400 },
        );
      }

      const passwordHash = await hash(password, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetTokenExpiresAt: null,
        },
      });

      return NextResponse.json(
        { message: "Heslo bylo změněno. Nyní se můžete přihlásit." },
        { status: 200 },
      );
    },
  );
}
