export type ConsentChoice = "all" | "essential";
export type ConsentSnapshot = ConsentChoice | null | "unknown";

export const CONSENT_COOKIE_NAME = "praha112_cookie_consent";
export const CONSENT_STORAGE_KEY = "praha112_cookie_consent";
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
export const CONSENT_UPDATED_EVENT = "praha112:consent-updated";

export function parseConsentChoice(value: string | null): ConsentChoice | null {
  if (value === "all" || value === "essential") {
    return value;
  }
  return null;
}

export function readConsentFromCookie(): ConsentChoice | null {
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

export function readConsentChoice(): ConsentChoice | null {
  const cookieValue = readConsentFromCookie();
  if (cookieValue) {
    return cookieValue;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return parseConsentChoice(window.localStorage.getItem(CONSENT_STORAGE_KEY));
}

export function saveConsentChoice(choice: ConsentChoice) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(choice)}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secureFlag}`;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
}
