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
};

const OCR_LANGUAGE = "ces+eng";
const FACE_RESIZE_WIDTH = 640;
const OCR_RESIZE_WIDTH = 1500;
const OCR_MAX_TEXT_LENGTH = 10_000;
const TESSERACT_OEM_LSTM_ONLY = 1;
const TESSERACT_CACHE_DIR = path.join(process.cwd(), ".cache", "tesseract");
const TESSERACT_NODE_WORKER_RELATIVE_PATH = path.join(
  "node_modules",
  "tesseract.js",
  "src",
  "worker-script",
  "node",
  "index.js",
);

let faceModelPromise: Promise<unknown> | null = null;

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

function getNormalizedTokens(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
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
  const normalizedOcr = normalizeText(ocrText);
  const aliases = getNormalizedAliases(districtName);

  for (const alias of aliases) {
    if (normalizedOcr.includes(alias) || normalizedOcr.replace(/\s+/g, "").includes(alias)) {
      return { matched: true, alias, exact: true };
    }
  }

  const ocrTokens = getNormalizedTokens(ocrText);
  if (ocrTokens.length === 0) {
    return { matched: false, alias: null, exact: false };
  }

  for (const alias of aliases) {
    const aliasTokens = alias.split(" ").filter((token) => token.length >= 3);

    if (aliasTokens.length === 0) {
      continue;
    }

    const allTokensMatched = aliasTokens.every((aliasToken) => {
      const maxDistance = allowedTokenDistance(aliasToken);
      return ocrTokens.some(
        (ocrToken) => levenshteinDistance(aliasToken, ocrToken) <= maxDistance,
      );
    });

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
  imageBuffer: Buffer,
  options: ExtractOcrTextOptions = {},
) {
  let pipeline = sharp(imageBuffer)
    .rotate()
    .resize({
      width: OCR_RESIZE_WIDTH,
      height: OCR_RESIZE_WIDTH,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (options.mirrorHorizontal) {
    pipeline = pipeline.flop();
  }

  const processed = await pipeline
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();

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

  try {
    const output = await worker.recognize(processed);
    return output.data.text.slice(0, OCR_MAX_TEXT_LENGTH);
  } finally {
    await worker.terminate();
  }
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
  let aliasMatch: DistrictAliasMatch = {
    matched: false,
    alias: null,
    exact: false,
  };

  try {
    ocrText = await extractOcrText(imageBuffer);
    aliasMatch = matchDistrictAlias(ocrText, input.districtName);

    if (!aliasMatch.matched) {
      try {
        const mirroredOcrText = await extractOcrText(imageBuffer, { mirrorHorizontal: true });
        const mirroredAliasMatch = matchDistrictAlias(mirroredOcrText, input.districtName);

        if (mirroredAliasMatch.matched) {
          ocrText = mirroredOcrText;
          aliasMatch = mirroredAliasMatch;
        }
      } catch (error) {
        console.error("Lokální OCR fallback pro zrcadlenou selfie selhal:", error);
      }
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
