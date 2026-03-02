import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { hashEmailVerificationToken } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { verifyEmailQuerySchema } from "@/lib/validation/auth";

function redirectToSignIn(request: Request, verification: string) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("verification", verification);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
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
      return redirectToSignIn(request, "invalid");
    }

    const { email, token } = parsed.data;
    const tokenHash = hashEmailVerificationToken(token);
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerifiedAt: true,
        emailVerificationTokenHash: true,
        emailVerificationTokenExpiresAt: true,
      },
    });

    if (!user) {
      return redirectToSignIn(request, "invalid");
    }

    if (user.emailVerifiedAt) {
      return redirectToSignIn(request, "already");
    }

    const tokenMatches =
      typeof user.emailVerificationTokenHash === "string"
      && user.emailVerificationTokenHash.length > 0
      && user.emailVerificationTokenHash === tokenHash;

    const tokenNotExpired =
      user.emailVerificationTokenExpiresAt instanceof Date
      && user.emailVerificationTokenExpiresAt >= now;

    if (!tokenMatches || !tokenNotExpired) {
      return redirectToSignIn(request, "invalid");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    return redirectToSignIn(request, "success");
  } catch (error) {
    console.error("Ověření e-mailu selhalo:", error);
    return redirectToSignIn(request, "error");
  }
}
