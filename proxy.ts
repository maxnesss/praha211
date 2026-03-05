import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const NONCE_HEADER_NAME = "x-nonce";
const CSP_HEADER_NAME = "Content-Security-Policy";

function getOriginFromUrl(value?: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function buildContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const umamiScriptOrigin = getOriginFromUrl(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL);
  const r2EndpointOrigin = getOriginFromUrl(process.env.R2_ENDPOINT);
  const scriptSrc = ["'self'", `'nonce-${nonce}'`];
  const connectSrc = ["'self'", "https://*.r2.cloudflarestorage.com"];

  if (isDevelopment) {
    scriptSrc.push("'unsafe-eval'");
  } else {
    scriptSrc.push("'strict-dynamic'");
  }

  if (umamiScriptOrigin) {
    scriptSrc.push(umamiScriptOrigin);
    connectSrc.push(umamiScriptOrigin);
  }

  if (r2EndpointOrigin) {
    connectSrc.push(r2EndpointOrigin);
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    `connect-src ${connectSrc.join(" ")}`,
  ];

  if (!isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ").replace(/\s{2,}/g, " ").trim();
}

function isHtmlRequest(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

export function proxy(request: NextRequest) {
  if (!isHtmlRequest(request)) {
    return NextResponse.next();
  }

  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER_NAME, nonce);
  requestHeaders.set(CSP_HEADER_NAME, contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set(CSP_HEADER_NAME, contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
