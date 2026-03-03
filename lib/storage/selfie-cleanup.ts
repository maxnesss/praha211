import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { isSelfieObjectKey } from "@/lib/selfie-upload-rules";
import { getR2Client, getR2Config } from "@/lib/storage/r2";

const DELETE_BATCH_SIZE = 1000;

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function listR2ObjectKeysByPrefix(prefix: string) {
  const r2Config = getR2Config();
  const client = getR2Client();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: r2Config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const item of response.Contents ?? []) {
      if (typeof item.Key === "string" && item.Key.length > 0) {
        keys.push(item.Key);
      }
    }

    continuationToken = response.IsTruncated
      ? (response.NextContinuationToken ?? undefined)
      : undefined;
  } while (continuationToken);

  return keys;
}

export async function deleteUserSelfieObjects(input: {
  userId: string;
  selfieKeys: string[];
}) {
  const r2Config = getR2Config();
  const client = getR2Client();
  const prefix = `selfies/${input.userId}/`;
  const listedKeys = await listR2ObjectKeysByPrefix(prefix);
  const keys = new Set<string>();

  for (const key of listedKeys) {
    if (isSelfieObjectKey(key)) {
      keys.add(key);
    }
  }

  for (const key of input.selfieKeys) {
    if (isSelfieObjectKey(key)) {
      keys.add(key);
    }
  }

  if (keys.size === 0) {
    return { requestedCount: 0, deletedCount: 0 };
  }

  const keyList = Array.from(keys);
  let deletedCount = 0;

  for (const batch of chunkArray(keyList, DELETE_BATCH_SIZE)) {
    const response = await client.send(
      new DeleteObjectsCommand({
        Bucket: r2Config.bucketName,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );

    if ((response.Errors?.length ?? 0) > 0) {
      const firstError = response.Errors?.[0];
      throw new Error(
        `Mazání selfie objektů selhalo (${firstError?.Code ?? "unknown"}: ${firstError?.Message ?? "bez zprávy"}).`,
      );
    }

    deletedCount += response.Deleted?.length ?? 0;
  }

  return {
    requestedCount: keyList.length,
    deletedCount,
  };
}
