import type { Metadata } from "next";

export const SITE_NAME = "PRAHA 112";
export const SITE_DESCRIPTION =
  "Pražská městská hra: odemkněte všech 112 katastrálních území, sbírejte body a budujte denní sérii.";

const FALLBACK_SITE_URL = "http://localhost:3000";

function toUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export function getSiteUrl() {
  const direct =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.SITE_URL?.trim();
  if (direct) {
    return toUrl(direct);
  }

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    || process.env.VERCEL_URL?.trim();
  if (vercel) {
    return toUrl(vercel);
  }

  return new URL(FALLBACK_SITE_URL);
}

export const NO_INDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};
