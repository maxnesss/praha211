"use client";

import { useState, useSyncExternalStore } from "react";

type ConsentChoice = "all" | "essential";
type ConsentSnapshot = ConsentChoice | null | "unknown";

const CONSENT_COOKIE_NAME = "praha112_cookie_consent";
const CONSENT_STORAGE_KEY = "praha112_cookie_consent";
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function parseConsentChoice(value: string | null): ConsentChoice | null {
  if (value === "all" || value === "essential") {
    return value;
  }
  return null;
}

function readConsentFromCookie(): ConsentChoice | null {
  if (typeof document === "undefined") {
    return null;
  }

  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!raw) {
    return null;
  }

  const value = raw.slice(CONSENT_COOKIE_NAME.length + 1);
  return parseConsentChoice(decodeURIComponent(value));
}

function readConsentChoice(): ConsentChoice | null {
  const cookieValue = readConsentFromCookie();
  if (cookieValue) {
    return cookieValue;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return parseConsentChoice(window.localStorage.getItem(CONSENT_STORAGE_KEY));
}

function saveConsentChoice(choice: ConsentChoice) {
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(choice)}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secureFlag}`;

  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
}

export function CookieConsentDialog() {
  const [dismissed, setDismissed] = useState(false);
  const consent = useSyncExternalStore(
    () => () => undefined,
    () => readConsentChoice(),
    () => "unknown" as ConsentSnapshot,
  );

  function handleChoice(choice: ConsentChoice) {
    saveConsentChoice(choice);
    setDismissed(true);
  }

  if (dismissed || consent === "unknown" || consent) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-5">
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Nastavení cookies"
        className="pointer-events-auto mx-auto max-w-3xl overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#081823]/88 shadow-[0_10px_24px_rgba(0,0,0,0.30)] backdrop-blur"
      >
        <div className="border-b border-cyan-300/20 bg-cyan-500/[0.06] px-4 py-2.5 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/85">
            Nastavení cookies
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-cyan-50 sm:text-lg">
            Pomozte nám nastavit práci s cookies
          </h2>
          <p className="text-sm leading-6 text-cyan-50/90">
            Nezbytné cookies zajišťují přihlášení, bezpečnost a správné fungování
            aplikace. Volitelně můžete povolit analytické cookies pro zlepšování
            prostředí PRAHA 112.
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em]">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-100/85">
              přihlášení
            </span>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-100/85">
              bezpečnost
            </span>
            <span className="rounded-full border border-orange-300/45 bg-orange-400/15 px-2.5 py-1 text-orange-100/90">
              analytika
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleChoice("essential")}
              className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-500/20"
            >
              Pouze nezbytné
            </button>
            <button
              type="button"
              onClick={() => handleChoice("all")}
              className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-50 transition-colors hover:bg-orange-400/30"
            >
              Povolit analytiku
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
