import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { prisma } from "@/lib/prisma";

function getHealthAccessError(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const configuredSecret = process.env.HEALTHCHECK_SECRET?.trim();
  if (!configuredSecret) {
    console.error("HEALTHCHECK_SECRET není nastaveno. /api/health/db je v produkci vypnuto.");
    return NextResponse.json(
      {
        ok: false,
        message: "Health endpoint není v produkci nakonfigurován.",
      },
      { status: 503 },
    );
  }

  const providedSecret = request.headers.get("x-health-check-secret")?.trim();
  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Přístup odepřen.",
      },
      { status: 403 },
    );
  }

  return null;
}

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit({
    request,
    prefix: "health-db",
    max: 300,
    windowMs: 5 * 60 * 1000,
    message: "Příliš mnoho health-check požadavků. Zkuste to prosím později.",
  });
  if (rateLimited) {
    return rateLimited;
  }

  const accessError = getHealthAccessError(request);
  if (accessError) {
    return accessError;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      message: "Připojení k databázi je v pořádku.",
    });
  } catch (error) {
    console.error("Kontrola zdraví databáze selhala", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Připojení k databázi selhalo.",
      },
      { status: 500 },
    );
  }
}
