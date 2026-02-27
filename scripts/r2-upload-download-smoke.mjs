import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parseArgs(argv) {
  const options = {
    prefix: "smoke-tests",
    keep: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--keep") {
      options.keep = true;
      continue;
    }

    if (token === "--prefix") {
      options.prefix = argv[index + 1]?.trim() || options.prefix;
      index += 1;
      continue;
    }

    if (token === "--bucket") {
      options.bucket = argv[index + 1]?.trim();
      index += 1;
      continue;
    }
  }

  return options;
}

async function streamToString(stream) {
  if (!stream) {
    return "";
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = options.bucket || requiredEnv("R2_BUCKET_NAME");
  const endpoint = (
    process.env.R2_ENDPOINT?.trim()
    || `https://${accountId}.r2.cloudflarestorage.com`
  ).replace(/\/+$/, "");

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const key = `${options.prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.txt`;
  const content = `R2 smoke test ${new Date().toISOString()} ${randomUUID()}`;

  console.log(`Bucket: ${bucketName}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Uploading: ${key}`);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: "text/plain; charset=utf-8",
      Body: content,
      CacheControl: "private, no-store",
    }),
  );

  const downloaded = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );

  const downloadedContent = await streamToString(downloaded.Body);
  if (downloadedContent !== content) {
    throw new Error("Downloaded content does not match uploaded content.");
  }

  console.log(`Downloaded and verified: ${key}`);

  if (!options.keep) {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    console.log(`Deleted: ${key}`);
  } else {
    console.log(`Kept object: ${key}`);
  }

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error("Smoke test failed:", error.message || error);
  process.exit(1);
});
