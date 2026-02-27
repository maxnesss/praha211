import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { authOptions } from "@/lib/auth";
import {
  isSelfieObjectKey,
  SELFIE_VIEW_URL_EXPIRES_IN_SECONDS,
} from "@/lib/selfie-upload-rules";
import { getR2Client, getR2Config } from "@/lib/storage/r2";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  const rateLimited = applyRateLimit({
    request,
    prefix: "selfie-view",
    userId,
    max: 60,
    windowMs: 5 * 60 * 1000,
    message: "Příliš mnoho požadavků na zobrazení selfie v krátkém čase.",
  });
  if (rateLimited) {
    return rateLimited;
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim() ?? "";

  if (!isSelfieObjectKey(key)) {
    return NextResponse.json({ message: "Neplatný klíč souboru." }, { status: 400 });
  }

  const claim = await prisma.districtClaim.findFirst({
    where: {
      selfieUrl: key,
      ...(isAdmin ? {} : { userId }),
    },
    select: { id: true },
  });

  if (!claim) {
    return NextResponse.json({ message: "Selfie nebyla nalezena." }, { status: 404 });
  }

  try {
    const r2Config = getR2Config();
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: SELFIE_VIEW_URL_EXPIRES_IN_SECONDS,
    });

    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    console.error("Podepsání přístupu k selfie selhalo:", error);
    return NextResponse.json(
      { message: "Nepodařilo se načíst selfie." },
      { status: 500 },
    );
  }
}
