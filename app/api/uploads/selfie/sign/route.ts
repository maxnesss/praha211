import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { authOptions } from "@/lib/auth";
import {
  isAllowedSelfieMimeType,
  SELFIE_MAX_SIZE_BYTES,
  SELFIE_UPLOAD_URL_EXPIRES_IN_SECONDS,
} from "@/lib/selfie-upload-rules";
import { getR2Client, getR2Config } from "@/lib/storage/r2";

const signSelfieUploadSchema = z
  .object({
    filename: z.string().trim().min(1).max(180),
    type: z.string().trim().min(1).max(120),
    size: z.number().int().positive().max(SELFIE_MAX_SIZE_BYTES),
    districtCode: z
      .string()
      .trim()
      .regex(/^D\d{3}$/)
      .optional(),
  })
  .refine((value) => isAllowedSelfieMimeType(value.type), {
    path: ["type"],
    message: "Nepodporovaný formát obrázku.",
  });

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function normalizeExtension(extension: string) {
  const normalized = extension.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) {
    return null;
  }
  return normalized === "jpeg" ? "jpg" : normalized;
}

function resolveFileExtension(type: string, filename: string) {
  const byType = extensionByMimeType[type.trim().toLowerCase()];
  if (byType) {
    return byType;
  }

  const fromFilenameRaw = filename.split(".").pop() ?? "";
  const fromFilename = normalizeExtension(fromFilenameRaw);
  if (fromFilename) {
    return fromFilename;
  }

  return "jpg";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const rateLimited = applyRateLimit({
    request,
    prefix: "selfie-upload-sign",
    userId,
    max: 30,
    windowMs: 5 * 60 * 1000,
    message: "Příliš mnoho požadavků na upload v krátkém čase. Zkuste to prosím později.",
  });
  if (rateLimited) {
    return rateLimited;
  }

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      { message: "Neplatné tělo požadavku." },
      { status: 400 },
    );
  }

  const parsed = signSelfieUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Neplatný požadavek." },
      { status: 400 },
    );
  }

  try {
    const r2Config = getR2Config();
    const client = getR2Client();
    const extension = resolveFileExtension(parsed.data.type, parsed.data.filename);
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const objectKey = `selfies/${userId}/${year}/${month}/${day}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: objectKey,
      ContentType: parsed.data.type,
      Metadata: {
        userId,
        districtCode: parsed.data.districtCode ?? "unknown",
        source: "district-claim",
      },
      CacheControl: "private, no-store",
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: SELFIE_UPLOAD_URL_EXPIRES_IN_SECONDS,
    });

    return NextResponse.json({
      method: "PUT",
      uploadUrl,
      selfieKey: objectKey,
      contentType: parsed.data.type,
      expiresIn: SELFIE_UPLOAD_URL_EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    console.error("Podepsání uploadu do R2 selhalo:", error);
    return NextResponse.json(
      { message: "Nepodařilo se připravit upload selfie." },
      { status: 500 },
    );
  }
}
