"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  CONSENT_UPDATED_EVENT,
  readConsentChoice,
} from "@/lib/cookie-consent";

const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() ?? "";
const UMAMI_SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim() ?? "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function isAnalyticsConsentGranted() {
  return readConsentChoice() === "all";
}

export function UmamiAnalytics() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!IS_PRODUCTION || !UMAMI_WEBSITE_ID || !UMAMI_SCRIPT_URL) {
      return;
    }

    const refreshConsent = () => {
      setIsEnabled(isAnalyticsConsentGranted());
    };

    refreshConsent();
    window.addEventListener(CONSENT_UPDATED_EVENT, refreshConsent);

    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, refreshConsent);
    };
  }, []);

  if (!IS_PRODUCTION || !UMAMI_WEBSITE_ID || !UMAMI_SCRIPT_URL || !isEnabled) {
    return null;
  }

  return (
    <Script
      id="umami-analytics"
      src={UMAMI_SCRIPT_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}
