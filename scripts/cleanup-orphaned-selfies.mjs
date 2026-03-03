#!/usr/bin/env node

import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const DEFAULT_ORPHAN_DAYS = 7;
const DELETE_BATCH_SIZE = 1000;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function getR2Config() {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = getRequiredEnv("R2_BUCKET_NAME");
  const endpoint = trimTrailingSlash(
    process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`,
  );

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  };
}

function isSelfieObjectKey(value) {
  return /^selfies\/[a-z0-9_\-/]+\.[a-z0-9]+$/i.test(value.trim());
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function listSelfieObjects(client, bucketName) {
  const items = [];
  let continuationToken = undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "selfies/",
        ContinuationToken: continuationToken,
      }),
    );

    for (const entry of response.Contents ?? []) {
      if (typeof entry.Key === "string" && entry.Key.length > 0) {
        items.push({
          key: entry.Key,
          lastModified: entry.LastModified ?? null,
        });
      }
    }

    continuationToken = response.IsTruncated
      ? (response.NextContinuationToken ?? undefined)
      : undefined;
  } while (continuationToken);

  return items;
}

async function main() {
  const prisma = new PrismaClient();
  const r2Config = getR2Config();
  const client = new S3Client({
    region: "auto",
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
    },
  });

  const orphanDays = Number(process.env.SELFIE_ORPHAN_DAYS ?? DEFAULT_ORPHAN_DAYS);
  const cutoffTime = Date.now() - orphanDays * 24 * 60 * 60 * 1000;

  try {
    const [claims, submissions] = await Promise.all([
      prisma.districtClaim.findMany({ select: { selfieUrl: true } }),
      prisma.districtClaimSubmission.findMany({ select: { selfieUrl: true } }),
    ]);

    const liveKeys = new Set([
      ...claims.map((item) => item.selfieUrl),
      ...submissions.map((item) => item.selfieUrl),
    ]);

    const objects = await listSelfieObjects(client, r2Config.bucketName);
    const orphaned = objects.filter((item) => {
      if (!isSelfieObjectKey(item.key)) {
        return false;
      }
      if (liveKeys.has(item.key)) {
        return false;
      }
      if (!item.lastModified) {
        return true;
      }
      return item.lastModified.getTime() < cutoffTime;
    });

    if (orphaned.length === 0) {
      console.log("Nalezeno 0 osamÄ›lÃ½ch selfie objektÅ¯.");
      return;
    }

    let deletedCount = 0;

    for (const batch of chunkArray(orphaned, DELETE_BATCH_SIZE)) {
      const response = await client.send(
        new DeleteObjectsCommand({
          Bucket: r2Config.bucketName,
          Delete: {
            Objects: batch.map((item) => ({ Key: item.key })),
            Quiet: true,
          },
        }),
      );

      deletedCount += response.Deleted?.length ?? 0;
      if ((response.Errors?.length ?? 0) > 0) {
        const firstError = response.Errors?.[0];
        throw new Error(
          `MazÃ¡nÃ­ selfie objektÅ¯ selhalo (${firstError?.Code ?? "unknown"}: ${firstError?.Message ?? "bez zprÃ¡vy"}).`,
        );
      }
    }

    console.log(`SmazÃ¡no ${deletedCount} osamÄ›lÃ½ch selfie objektÅ¯ (limit ${orphanDays} dnÃ­).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("FAIL cleanup-orphaned-selfies");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
