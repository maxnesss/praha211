import type { ImageLoaderProps } from "next/image";

const COAT_IMAGE_CACHE_VERSION = "20260228";

export function coatImageLoader({ src, width, quality }: ImageLoaderProps) {
  const resolvedQuality = quality ?? 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${resolvedQuality}&v=${COAT_IMAGE_CACHE_VERSION}`;
}
