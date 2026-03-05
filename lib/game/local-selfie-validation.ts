import "server-only";

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { isSelfieObjectKey } from "@/lib/selfie-upload-rules";
import { getR2Client, getR2Config } from "@/lib/storage/r2";

type LocalClaimValidationVerdict = "PASS" | "REVIEW";

type DistrictAliasMatch = {
  matched: boolean;
  alias: string | null;
  exact: boolean;
};

export type LocalClaimValidationResult = {
  verdict: LocalClaimValidationVerdict;
  confidence: number;
  faceDetected: boolean;
  faceCount: number;
  districtNameMatched: boolean;
  matchedAlias: string | null;
  ocrText: string;
  reasons: string[];
};

type ValidateDistrictSelfieInput = {
  selfieUrl: string;
  districtName: string;
};

type ExtractOcrTextOptions = {
  mirrorHorizontal?: boolean;
  rotateDegrees?: number;
  thresholdMode?: boolean;
  invertColors?: boolean;
  pageSegMode?: TesseractPageSegMode;
};

type TesseractPageSegMode = "3" | "6" | "11";

type OcrWorker = {
  recognize: (image: Buffer) => Promise<{ data: { text: string } }>;
  setParameters?: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

type OcrAttempt = {
  text: string;
  aliasMatch: DistrictAliasMatch;
};

type OcrRunResult = {
  bestAttempt: OcrAttempt | null;
  attemptsUsed: number;
};

type RedComponent = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  areaRatio: number;
  pixelCount: number;
  fillRatio: number;
  aspectRatio: number;
};

const OCR_LANGUAGE = "ces+eng";
const FACE_RESIZE_WIDTH = 640;
const OCR_RESIZE_WIDTH = 1400;
const OCR_MAX_TEXT_LENGTH = 10_000;
const RED_SIGN_DETECTION_SIZE = 900;
const RED_SIGN_MAX_CANDIDATES = 3;
const RED_SIGN_MAX_AREA_RATIO = 0.15;
const RED_SIGN_CROP_PADDING = 24;
const TESSERACT_OEM_LSTM_ONLY = 1;
const TESSERACT_PSM_AUTO: TesseractPageSegMode = "3";
const TESSERACT_PSM_SINGLE_BLOCK: TesseractPageSegMode = "6";
const TESSERACT_PSM_SPARSE_TEXT: TesseractPageSegMode = "11";
const TESSERACT_CACHE_DIR = path.join(process.cwd(), ".cache", "tesseract");
const TESSERACT_NODE_WORKER_RELATIVE_PATH = path.join(
  "node_modules",
  "tesseract.js",
  "src",
  "worker-script",
  "node",
  "index.js",
);
const OCR_CONFUSABLE_DIGIT_MAP: Record<string, string> = {
  0: "o",
  1: "i",
  2: "z",
  3: "e",
  4: "a",
  5: "s",
  6: "g",
  7: "t",
  8: "b",
  9: "g",
};

let faceModelPromise: Promise<unknown> | null = null;

const QUICK_OCR_VARIANTS: ExtractOcrTextOptions[] = [
  { pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  { mirrorHorizontal: true, pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  { rotateDegrees: 90, mirrorHorizontal: true, pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  { rotateDegrees: 270, mirrorHorizontal: true, pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  { pageSegMode: TESSERACT_PSM_AUTO },
  { pageSegMode: TESSERACT_PSM_SINGLE_BLOCK },
];

const QUICK_THRESHOLD_OCR_VARIANTS: ExtractOcrTextOptions[] = [
  { thresholdMode: true, pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  { thresholdMode: true, mirrorHorizontal: true, pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  { thresholdMode: true, invertColors: true, pageSegMode: TESSERACT_PSM_SPARSE_TEXT },
  {
    thresholdMode: true,
    invertColors: true,
    mirrorHorizontal: true,
    pageSegMode: TESSERACT_PSM_SPARSE_TEXT,
  },
];

const DEEP_OCR_FALLBACK_VARIANTS: ExtractOcrTextOptions[] = [
  { rotateDegrees: 90, pageSegMode: TESSERACT_PSM_SINGLE_BLOCK },
  { rotateDegrees: 270, pageSegMode: TESSERACT_PSM_SINGLE_BLOCK },
  { rotateDegrees: 180, pageSegMode: TESSERACT_PSM_SINGLE_BLOCK },
  { rotateDegrees: 180, mirrorHorizontal: true, pageSegMode: TESSERACT_PSM_SINGLE_BLOCK },
  {
    thresholdMode: true,
    rotateDegrees: 90,
    mirrorHorizontal: true,
    pageSegMode: TESSERACT_PSM_SINGLE_BLOCK,
  },
  {
    thresholdMode: true,
    rotateDegrees: 270,
    mirrorHorizontal: true,
    pageSegMode: TESSERACT_PSM_SINGLE_BLOCK,
  },
  {
    thresholdMode: true,
    invertColors: true,
    rotateDegrees: 90,
    mirrorHorizontal: true,
    pageSegMode: TESSERACT_PSM_SPARSE_TEXT,
  },
  {
    thresholdMode: true,
    invertColors: true,
    rotateDegrees: 270,
    mirrorHorizontal: true,
    pageSegMode: TESSERACT_PSM_SPARSE_TEXT,
  },
  {
    thresholdMode: true,
    invertColors: true,
    pageSegMode: TESSERACT_PSM_SPARSE_TEXT,
  },
];

function resolveTesseractWorkerPath() {
  const workerPath = path.join(process.cwd(), TESSERACT_NODE_WORKER_RELATIVE_PATH);
  return existsSync(workerPath) ? workerPath : null;
}

function resolveTesseractCachePath() {
  const cachePath = process.env.OCR_CACHE_DIR?.trim() || TESSERACT_CACHE_DIR;
  mkdirSync(cachePath, { recursive: true });
  return cachePath;
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeText(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getNormalizedAliases(districtName: string) {
  const normalized = normalizeText(districtName);
  const aliases = new Set<string>();

  aliases.add(normalized);
  aliases.add(normalized.replace(/\s+/g, ""));

  if (normalized.startsWith("praha ")) {
    aliases.add(normalized.replace(/^praha\s+/, ""));
  }

  const withoutGlueWords = normalized
    .replace(/\b(u|nad|pod|na)\b/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (withoutGlueWords) {
    aliases.add(withoutGlueWords);
  }

  return [...aliases].filter((alias) => alias.length >= 3);
}

function splitNormalizedTokens(normalized: string) {
  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function replaceConfusableDigits(value: string) {
  return value.replace(/[0-9]/g, (digit) => OCR_CONFUSABLE_DIGIT_MAP[digit] ?? digit);
}

function getNormalizedOcrVariants(ocrText: string) {
  const normalized = normalizeText(ocrText);
  if (!normalized) {
    return [];
  }

  const variants = new Set<string>([normalized]);
  const compact = normalized.replace(/\s+/g, "");
  if (compact.length >= 3) {
    variants.add(compact);
  }

  const correctedDigits = replaceConfusableDigits(normalized);
  if (correctedDigits !== normalized) {
    variants.add(correctedDigits);
    const compactCorrected = correctedDigits.replace(/\s+/g, "");
    if (compactCorrected.length >= 3) {
      variants.add(compactCorrected);
    }
  }

  return [...variants];
}

function getOcrTokenVariants(ocrText: string) {
  const normalized = normalizeText(ocrText);
  if (!normalized) {
    return [];
  }

  const candidates = new Set<string>([normalized, replaceConfusableDigits(normalized)]);
  const tokenVariants = [...candidates]
    .map((candidate) => splitNormalizedTokens(candidate))
    .filter((tokens) => tokens.length > 0);

  return tokenVariants;
}

function tokenMatches(aliasToken: string, ocrToken: string) {
  const maxDistance = allowedTokenDistance(aliasToken);
  return levenshteinDistance(aliasToken, ocrToken) <= maxDistance;
}

function matchTokensInOrder(aliasTokens: string[], ocrTokens: string[]) {
  let searchFromIndex = 0;

  for (const aliasToken of aliasTokens) {
    let matchedIndex = -1;

    for (let index = searchFromIndex; index < ocrTokens.length; index += 1) {
      if (tokenMatches(aliasToken, ocrTokens[index] ?? "")) {
        matchedIndex = index;
        break;
      }
    }

    if (matchedIndex === -1) {
      return false;
    }

    searchFromIndex = matchedIndex + 1;
  }

  return true;
}

function matchTokensUnordered(aliasTokens: string[], ocrTokens: string[]) {
  return aliasTokens.every((aliasToken) => (
    ocrTokens.some((ocrToken) => tokenMatches(aliasToken, ocrToken))
  ));
}

function matchAliasTokens(aliasTokens: string[], ocrTokenVariants: string[][]) {
  if (aliasTokens.length === 0 || ocrTokenVariants.length === 0) {
    return false;
  }

  return ocrTokenVariants.some((ocrTokens) => (
    matchTokensInOrder(aliasTokens, ocrTokens)
    || matchTokensUnordered(aliasTokens, ocrTokens)
  ));
}

function matchAliasExact(alias: string, normalizedOcrVariants: string[]) {
  return normalizedOcrVariants.some((ocrVariant) => (
    ocrVariant.includes(alias)
    || ocrVariant.replace(/\s+/g, "").includes(alias)
  ));
}

function getAliasTokens(alias: string) {
  return splitNormalizedTokens(alias);
}

function getOcrTokensForFallback(ocrText: string) {
  return splitNormalizedTokens(normalizeText(ocrText));
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  if (a.length === 0) {
    return b.length;
  }

  if (b.length === 0) {
    return a.length;
  }

  const dp = Array.from({ length: a.length + 1 }, (_, index) => index);

  for (let column = 1; column <= b.length; column += 1) {
    let previousDiagonal = dp[0];
    dp[0] = column;

    for (let row = 1; row <= a.length; row += 1) {
      const current = dp[row];
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      dp[row] = Math.min(
        dp[row] + 1,
        dp[row - 1] + 1,
        previousDiagonal + cost,
      );
      previousDiagonal = current;
    }
  }

  return dp[a.length];
}

function allowedTokenDistance(token: string) {
  if (token.length >= 9) {
    return 2;
  }

  if (token.length >= 6) {
    return 1;
  }

  return 0;
}

function matchDistrictAlias(ocrText: string, districtName: string): DistrictAliasMatch {
  const normalizedOcrVariants = getNormalizedOcrVariants(ocrText);
  const aliases = getNormalizedAliases(districtName);
  const ocrTokenVariants = getOcrTokenVariants(ocrText);

  for (const alias of aliases) {
    if (matchAliasExact(alias, normalizedOcrVariants)) {
      return { matched: true, alias, exact: true };
    }
  }

  const ocrTokens = getOcrTokensForFallback(ocrText);
  if (ocrTokens.length === 0) {
    return { matched: false, alias: null, exact: false };
  }

  for (const alias of aliases) {
    const aliasTokens = getAliasTokens(alias);

    if (aliasTokens.length === 0) {
      continue;
    }

    const allTokensMatched = matchAliasTokens(
      aliasTokens,
      ocrTokenVariants.length > 0 ? ocrTokenVariants : [ocrTokens],
    );

    if (allTokensMatched) {
      return { matched: true, alias, exact: false };
    }
  }

  return { matched: false, alias: null, exact: false };
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    throw new Error("R2 objekt neobsahuje data.");
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (
    typeof body === "object"
    && body !== null
    && "transformToByteArray" in body
    && typeof body.transformToByteArray === "function"
  ) {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (
    typeof body === "object"
    && body !== null
    && "arrayBuffer" in body
    && typeof body.arrayBuffer === "function"
  ) {
    const arrayBuffer = await body.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Nepodporovaný typ streamu pro načtení selfie.");
}

async function readSelfieBufferFromR2(selfieUrl: string) {
  const r2Config = getR2Config();
  const client = getR2Client();
  const object = await client.send(
    new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: selfieUrl,
    }),
  );

  return bodyToBuffer(object.Body);
}

async function getFaceModel() {
  if (faceModelPromise) {
    return faceModelPromise;
  }

  faceModelPromise = (async () => {
    const tf = await import("@tensorflow/tfjs-core");
    await import("@tensorflow/tfjs-backend-cpu");

    if (tf.getBackend() !== "cpu") {
      await tf.setBackend("cpu");
    }

    await tf.ready();

    const blazeface = await import("@tensorflow-models/blazeface");
    return blazeface.load();
  })();

  return faceModelPromise;
}

async function detectFaceCount(imageBuffer: Buffer) {
  const tf = await import("@tensorflow/tfjs-core");
  const model = (await getFaceModel()) as {
    estimateFaces: (input: unknown, returnTensors: boolean) => Promise<unknown[]>;
  };

  const prepared = await sharp(imageBuffer)
    .rotate()
    .resize({
      width: FACE_RESIZE_WIDTH,
      height: FACE_RESIZE_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = tf.tensor3d(
    prepared.data,
    [prepared.info.height, prepared.info.width, prepared.info.channels],
    "int32",
  );

  try {
    const predictions = await model.estimateFaces(tensor, false);
    return predictions.length;
  } finally {
    tensor.dispose();
  }
}

async function extractOcrText(
  worker: OcrWorker,
  imageBuffer: Buffer,
  options: ExtractOcrTextOptions = {},
) {
  const pageSegMode = options.pageSegMode ?? TESSERACT_PSM_SPARSE_TEXT;
  if (worker.setParameters) {
    await worker.setParameters({
      tessedit_pageseg_mode: pageSegMode,
      preserve_interword_spaces: "1",
    });
  }

  let pipeline = sharp(imageBuffer).rotate();

  if (options.rotateDegrees) {
    pipeline = pipeline.rotate(options.rotateDegrees);
  }

  pipeline = pipeline.resize({
    width: OCR_RESIZE_WIDTH,
    height: OCR_RESIZE_WIDTH,
    fit: "inside",
    withoutEnlargement: false,
  });

  if (options.mirrorHorizontal) {
    pipeline = pipeline.flop();
  }

  let processedPipeline = options.thresholdMode
    ? pipeline
      .grayscale()
      .normalize()
      .linear(1.35, -15)
      .threshold(160)
    : pipeline
      .grayscale()
      .normalize()
      .sharpen();

  if (options.invertColors) {
    processedPipeline = processedPipeline.negate({ alpha: false });
  }

  const processed = await processedPipeline
    .png()
    .toBuffer();

  const output = await worker.recognize(processed);
  return output.data.text.slice(0, OCR_MAX_TEXT_LENGTH);
}

async function createOcrWorker(): Promise<OcrWorker> {
  const workerPath = resolveTesseractWorkerPath();
  if (!workerPath) {
    throw new Error(
      `Tesseract worker script nebyl nalezen: ${TESSERACT_NODE_WORKER_RELATIVE_PATH}.`,
    );
  }

  const cachePath = resolveTesseractCachePath();
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(OCR_LANGUAGE, TESSERACT_OEM_LSTM_ONLY, {
    workerPath,
    cachePath,
    cacheMethod: "write",
    errorHandler: (error) => {
      console.error("Tesseract worker runtime chyba:", error);
    },
  });

  return worker;
}

function pickBetterOcrAttempt(
  current: OcrAttempt | null,
  candidate: OcrAttempt,
) {
  if (!current) {
    return candidate;
  }

  if (candidate.aliasMatch.matched && !current.aliasMatch.matched) {
    return candidate;
  }

  if (!candidate.aliasMatch.matched && current.aliasMatch.matched) {
    return current;
  }

  if (candidate.aliasMatch.exact && !current.aliasMatch.exact) {
    return candidate;
  }

  if (!candidate.aliasMatch.exact && current.aliasMatch.exact) {
    return current;
  }

  return normalizeText(candidate.text).length > normalizeText(current.text).length
    ? candidate
    : current;
}

function isLikelyRedSignPixel(r: number, g: number, b: number) {
  return r > 120
    && (r - g) > 35
    && (r - b) > 35
    && g < 175
    && b < 175;
}

function collectRedSignComponents(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
) {
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * channels;
      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;
      if (isLikelyRedSignPixel(r, g, b)) {
        mask[y * width + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(width * height);
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  const components: RedComponent[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const startIndex = y * width + x;
      if (!mask[startIndex] || visited[startIndex]) {
        continue;
      }

      const queue: number[] = [startIndex];
      visited[startIndex] = 1;
      let queueIndex = 0;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let pixelCount = 0;

      while (queueIndex < queue.length) {
        const currentIndex = queue[queueIndex] ?? 0;
        queueIndex += 1;
        const currentX = currentIndex % width;
        const currentY = Math.floor(currentIndex / width);

        pixelCount += 1;
        if (currentX < minX) minX = currentX;
        if (currentX > maxX) maxX = currentX;
        if (currentY < minY) minY = currentY;
        if (currentY > maxY) maxY = currentY;

        for (const [dx, dy] of directions) {
          const nextX = currentX + dx;
          const nextY = currentY + dy;
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
            continue;
          }

          const nextIndex = nextY * width + nextX;
          if (!mask[nextIndex] || visited[nextIndex]) {
            continue;
          }

          visited[nextIndex] = 1;
          queue.push(nextIndex);
        }
      }

      const componentWidth = maxX - minX + 1;
      const componentHeight = maxY - minY + 1;
      const area = componentWidth * componentHeight;
      const areaRatio = area / (width * height);
      const fillRatio = area > 0 ? pixelCount / area : 0;
      const aspectRatio = componentHeight > 0 ? componentWidth / componentHeight : 0;

      if (
        pixelCount >= 120
        && area >= 200
        && areaRatio <= RED_SIGN_MAX_AREA_RATIO
        && aspectRatio > 1.2
        && aspectRatio < 5.5
        && fillRatio > 0.2
      ) {
        components.push({
          minX,
          maxX,
          minY,
          maxY,
          width: componentWidth,
          height: componentHeight,
          areaRatio,
          pixelCount,
          fillRatio,
          aspectRatio,
        });
      }
    }
  }

  return components.sort((a, b) => b.pixelCount - a.pixelCount);
}

function toCropArea(input: {
  component: RedComponent;
  scaleX: number;
  scaleY: number;
  sourceWidth: number;
  sourceHeight: number;
}) {
  const left = Math.max(
    0,
    Math.floor(input.component.minX * input.scaleX - RED_SIGN_CROP_PADDING),
  );
  const top = Math.max(
    0,
    Math.floor(input.component.minY * input.scaleY - RED_SIGN_CROP_PADDING),
  );
  const width = Math.min(
    input.sourceWidth - left,
    Math.ceil(input.component.width * input.scaleX + RED_SIGN_CROP_PADDING * 2),
  );
  const height = Math.min(
    input.sourceHeight - top,
    Math.ceil(input.component.height * input.scaleY + RED_SIGN_CROP_PADDING * 2),
  );

  if (width <= 1 || height <= 1) {
    return null;
  }

  return { left, top, width, height };
}

async function extractRedSignCandidateBuffers(imageBuffer: Buffer) {
  const orientedBuffer = await sharp(imageBuffer)
    .rotate()
    .png()
    .toBuffer();
  const sourceMeta = await sharp(orientedBuffer).metadata();
  const sourceWidth = sourceMeta.width ?? 0;
  const sourceHeight = sourceMeta.height ?? 0;
  if (sourceWidth <= 1 || sourceHeight <= 1) {
    return [];
  }

  const downscaled = await sharp(orientedBuffer)
    .resize({
      width: RED_SIGN_DETECTION_SIZE,
      height: RED_SIGN_DETECTION_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const components = collectRedSignComponents(
    downscaled.data,
    downscaled.info.width,
    downscaled.info.height,
    downscaled.info.channels,
  ).slice(0, RED_SIGN_MAX_CANDIDATES);

  if (components.length === 0) {
    return [];
  }

  const scaleX = sourceWidth / downscaled.info.width;
  const scaleY = sourceHeight / downscaled.info.height;
  const candidateBuffers: Buffer[] = [];

  for (const component of components) {
    const cropArea = toCropArea({
      component,
      scaleX,
      scaleY,
      sourceWidth,
      sourceHeight,
    });
    if (!cropArea) {
      continue;
    }

    const cropped = await sharp(orientedBuffer)
      .extract(cropArea)
      .png()
      .toBuffer();
    candidateBuffers.push(cropped);
  }

  return candidateBuffers;
}

async function runOcrVariants(
  input: {
    worker: OcrWorker;
    imageBuffer: Buffer;
    districtName: string;
    variants: ExtractOcrTextOptions[];
    stopOnMatched?: boolean;
  },
): Promise<OcrRunResult> {
  let bestAttempt: OcrAttempt | null = null;
  let attemptsUsed = 0;
  const stopOnMatched = input.stopOnMatched ?? true;

  for (const variant of input.variants) {
    try {
      attemptsUsed += 1;
      const variantText = await extractOcrText(input.worker, input.imageBuffer, variant);
      const variantMatch = matchDistrictAlias(variantText, input.districtName);
      const attempt: OcrAttempt = {
        text: variantText,
        aliasMatch: variantMatch,
      };
      bestAttempt = pickBetterOcrAttempt(bestAttempt, attempt);

      if (stopOnMatched && variantMatch.matched) {
        break;
      }
    } catch (error) {
      console.error("Lokální OCR varianta selhala:", error);
    }
  }

  return { bestAttempt, attemptsUsed };
}

function buildConfidence(input: {
  districtNameMatched: boolean;
  exactDistrictMatch: boolean;
  faceCount: number;
}) {
  const districtScore = input.districtNameMatched
    ? input.exactDistrictMatch
      ? 0.62
      : 0.52
    : 0;
  const faceScore = input.faceCount > 0
    ? Math.min(0.45, 0.3 + Math.min(input.faceCount, 3) * 0.05)
    : 0;

  const total = Math.min(1, districtScore + faceScore);
  return Number(total.toFixed(2));
}

export async function validateDistrictSelfieLocally(
  input: ValidateDistrictSelfieInput,
): Promise<LocalClaimValidationResult> {
  const validationStartedAt = Date.now();
  if (!isSelfieObjectKey(input.selfieUrl)) {
    return {
      verdict: "REVIEW",
      confidence: 0,
      faceDetected: false,
      faceCount: 0,
      districtNameMatched: false,
      matchedAlias: null,
      ocrText: "",
      reasons: [
        "Selfie není uložená pod interním klíčem úložiště. Je potřeba ruční kontrola.",
      ],
    };
  }

  let imageBuffer: Buffer;

  try {
    imageBuffer = await readSelfieBufferFromR2(input.selfieUrl);
  } catch (error) {
    console.error("Načtení selfie z R2 pro lokální validaci selhalo:", error);
    return {
      verdict: "REVIEW",
      confidence: 0,
      faceDetected: false,
      faceCount: 0,
      districtNameMatched: false,
      matchedAlias: null,
      ocrText: "",
      reasons: ["Nepodařilo se načíst selfie soubor. Je potřeba ruční kontrola."],
    };
  }

  let faceCount = 0;
  const reasons: string[] = [];

  try {
    faceCount = await detectFaceCount(imageBuffer);
  } catch (error) {
    console.error("Lokální detekce obličeje selhala:", error);
    reasons.push("Lokální detekce obličeje selhala. Je potřeba ruční kontrola.");
  }

  let ocrText = "";
  let ocrAttemptsUsed = 0;
  let aliasMatch: DistrictAliasMatch = {
    matched: false,
    alias: null,
    exact: false,
  };

  try {
    const worker = await createOcrWorker();
    let bestAttempt: OcrAttempt | null = null;
    let signCandidates: Buffer[] = [];

    try {
      const fullImageRun = await runOcrVariants({
        worker,
        imageBuffer,
        districtName: input.districtName,
        variants: QUICK_OCR_VARIANTS,
      });
      ocrAttemptsUsed += fullImageRun.attemptsUsed;
      bestAttempt = fullImageRun.bestAttempt;

      if (!bestAttempt?.aliasMatch.matched) {
        signCandidates = await extractRedSignCandidateBuffers(imageBuffer);
        for (const candidateBuffer of signCandidates) {
          const candidateRun = await runOcrVariants({
            worker,
            imageBuffer: candidateBuffer,
            districtName: input.districtName,
            variants: [...QUICK_OCR_VARIANTS, ...QUICK_THRESHOLD_OCR_VARIANTS],
          });
          ocrAttemptsUsed += candidateRun.attemptsUsed;
          if (!candidateRun.bestAttempt) {
            continue;
          }
          bestAttempt = pickBetterOcrAttempt(bestAttempt, candidateRun.bestAttempt);

          if (bestAttempt?.aliasMatch.matched) {
            break;
          }
        }
      }

      if (!bestAttempt?.aliasMatch.matched) {
        const deepFallbackTargets = signCandidates.length > 0
          ? [signCandidates[0], imageBuffer]
          : [imageBuffer];

        for (const targetBuffer of deepFallbackTargets) {
          const deepRun = await runOcrVariants({
            worker,
            imageBuffer: targetBuffer,
            districtName: input.districtName,
            variants: DEEP_OCR_FALLBACK_VARIANTS,
          });
          ocrAttemptsUsed += deepRun.attemptsUsed;
          if (!deepRun.bestAttempt) {
            continue;
          }
          bestAttempt = pickBetterOcrAttempt(bestAttempt, deepRun.bestAttempt);
          if (bestAttempt?.aliasMatch.matched) {
            break;
          }
        }
      }
    } catch (error) {
      console.error("Lokální OCR fallback se selháním kandidátů cedule:", error);
    } finally {
      await worker.terminate();
    }

    if (bestAttempt) {
      ocrText = bestAttempt.text;
      aliasMatch = bestAttempt.aliasMatch;
    }
  } catch (error) {
    console.error("Lokální OCR validace selhala:", error);
    reasons.push("Lokální čtení textu z cedule selhalo. Je potřeba ruční kontrola.");
  }

  const districtNameMatched = aliasMatch.matched;
  const faceDetected = faceCount > 0;

  if (!districtNameMatched) {
    reasons.push(`Nepodařilo se potvrdit název městské části „${input.districtName}“ na ceduli.`);
  }

  if (!faceDetected) {
    reasons.push("Na selfie nebyl rozpoznán obličej. Je potřeba ruční kontrola.");
  }

  const confidence = buildConfidence({
    districtNameMatched,
    exactDistrictMatch: aliasMatch.exact,
    faceCount,
  });

  const verdict: LocalClaimValidationVerdict = districtNameMatched && faceDetected
    ? "PASS"
    : "REVIEW";

  console.info("Lokální validace selfie dokončena", {
    selfieUrl: input.selfieUrl,
    districtName: input.districtName,
    verdict,
    districtNameMatched,
    faceCount,
    ocrAttemptsUsed,
    durationMs: Date.now() - validationStartedAt,
  });

  return {
    verdict,
    confidence,
    faceDetected,
    faceCount,
    districtNameMatched,
    matchedAlias: aliasMatch.alias,
    ocrText: ocrText.trim(),
    reasons,
  };
}
