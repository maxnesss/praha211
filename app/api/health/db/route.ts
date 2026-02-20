import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
