#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createWorker } from "tesseract.js";

const OCR_LANGS = process.env.OCR_LANGS?.trim() || "ces+eng";
const OCR_CACHE_DIR = process.env.OCR_CACHE_DIR?.trim()
  || path.join(process.cwd(), ".cache", "tesseract");
const TESSERACT_WORKER_PATH = path.join(
  process.cwd(),
  "node_modules",
  "tesseract.js",
  "src",
  "worker-script",
  "node",
  "index.js",
);
const TESSERACT_OEM_LSTM_ONLY = 1;

async function main() {
  await mkdir(OCR_CACHE_DIR, { recursive: true });

  console.log(`[ocr:warmup] Langs: ${OCR_LANGS}`);
  console.log(`[ocr:warmup] Cache: ${OCR_CACHE_DIR}`);

  const worker = await createWorker(OCR_LANGS, TESSERACT_OEM_LSTM_ONLY, {
    workerPath: TESSERACT_WORKER_PATH,
    cachePath: OCR_CACHE_DIR,
    cacheMethod: "write",
    errorHandler: (error) => {
      console.error("[ocr:warmup] Worker runtime error:", error);
    },
  });

  await worker.terminate();
  console.log("[ocr:warmup] Ready.");
}

main().catch((error) => {
  console.error("[ocr:warmup] Failed:", error);
  process.exitCode = 1;
});
