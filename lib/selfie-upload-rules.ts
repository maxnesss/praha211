export const SELFIE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const SELFIE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const SELFIE_UPLOAD_URL_EXPIRES_IN_SECONDS = 60;
export const SELFIE_VIEW_URL_EXPIRES_IN_SECONDS = 60;

const SELFIE_ALLOWED_MIME_TYPE_SET = new Set<string>(SELFIE_ALLOWED_MIME_TYPES);

export function isAllowedSelfieMimeType(type: string) {
  return SELFIE_ALLOWED_MIME_TYPE_SET.has(type.trim().toLowerCase());
}

export function isSelfieObjectKey(value: string) {
  return /^selfies\/[a-z0-9_\-/]+\.[a-z0-9]+$/i.test(value.trim());
}
