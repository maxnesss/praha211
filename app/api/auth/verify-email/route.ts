import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  hashEmailVerificationToken,
  sendWelcomeEmail,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/seo";
import { verifyEmailQuerySchema } from "@/lib/validation/auth";

function redirectToSignIn(verification: string) {
  const url = new URL("/sign-in", getSiteUrl());
  url.searchParams.set("verification", verification);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  return withApiWriteObservability(
    { request, operation: "auth.verify_email" },
    async () => {
  const rateLimited = applyRateLimit({
    request,
    prefix: "auth-verify-email",
    max: 40,
    windowMs: 15 * 60 * 1000,
    message: "Příliš mnoho pokusů o ověření e-mailu. Zkuste to prosím později.",
  });
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const requestUrl = new URL(request.url);
    const parsed = verifyEmailQuerySchema.safeParse({
      email: requestUrl.searchParams.get("email") ?? "",
      token: requestUrl.searchParams.get("token") ?? "",
    });

    if (!parsed.success) {
      return redirectToSignIn("invalid");
    }

    const { email, token } = parsed.data;
    const tokenHash = hashEmailVerificationToken(token);
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        emailVerificationTokenHash: true,
        emailVerificationTokenExpiresAt: true,
      },
    });

    if (!user) {
      return redirectToSignIn("invalid");
    }

    if (user.emailVerifiedAt) {
      return redirectToSignIn("already");
    }

    const tokenMatches =
      typeof user.emailVerificationTokenHash === "string"
      && user.emailVerificationTokenHash.length > 0
      && user.emailVerificationTokenHash === tokenHash;

    const tokenNotExpired =
      user.emailVerificationTokenExpiresAt instanceof Date
      && user.emailVerificationTokenExpiresAt >= now;

    if (!tokenMatches || !tokenNotExpired) {
      return redirectToSignIn("invalid");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    try {
      await sendWelcomeEmail({ email: user.email });
    } catch (error) {
      console.error("Odeslání uvítacího e-mailu selhalo:", error);
    }

    return redirectToSignIn("success");
  } catch (error) {
    console.error("Ověření e-mailu selhalo:", error);
    return redirectToSignIn("error");
  }
    },
  );
}
