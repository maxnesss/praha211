import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
const CREDENTIALS_CALLBACK_PATH = "/api/auth/callback/credentials";
const LOGIN_RATE_LIMIT_ERROR = "TOO_MANY_LOGIN_ATTEMPTS";
const LOGIN_RATE_LIMIT_MESSAGE = "Příliš mnoho pokusů o přihlášení. Zkuste to prosím za chvíli znovu.";

function isCredentialsCallbackRequest(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  return pathname === CREDENTIALS_CALLBACK_PATH;
}

export const GET = handler;

export async function POST(
  request: Request,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (isCredentialsCallbackRequest(request)) {
    const rateLimited = applyRateLimit({
      request,
      prefix: "auth-credentials-signin",
      max: 12,
      windowMs: 10 * 60 * 1000,
      message: LOGIN_RATE_LIMIT_MESSAGE,
    });

    if (rateLimited) {
      const retryAfter = rateLimited.headers.get("Retry-After");
      const errorUrl = new URL(
        `/sign-in?error=${encodeURIComponent(LOGIN_RATE_LIMIT_ERROR)}`,
        request.url,
      ).toString();

      return NextResponse.json(
        {
          url: errorUrl,
          message: LOGIN_RATE_LIMIT_MESSAGE,
        },
        {
          status: 429,
          headers: retryAfter
            ? {
              "Retry-After": retryAfter,
            }
            : undefined,
        },
      );
    }
  }

  return handler(request, context);
}
