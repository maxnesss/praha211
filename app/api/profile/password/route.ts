import { compare, hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  getProfileValidationMessage,
} from "@/lib/validation/profile";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  try {
    let body: unknown;

    try {
      body = (await request.json()) as unknown;
    } catch {
      return NextResponse.json(
        { message: "Neplatné tělo požadavku." },
        { status: 400 },
      );
    }

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: getProfileValidationMessage(parsed.error) },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Uživatel nebyl nalezen." }, { status: 404 });
    }

    const currentPassword = parsed.data.currentPassword ?? "";
    const hasPassword = Boolean(user.passwordHash);

    if (hasPassword && currentPassword.length === 0) {
      return NextResponse.json(
        { message: "Zadejte aktuální heslo." },
        { status: 400 },
      );
    }

    if (hasPassword && user.passwordHash) {
      const matches = await compare(currentPassword, user.passwordHash);
      if (!matches) {
        return NextResponse.json(
          { message: "Aktuální heslo není správné." },
          { status: 400 },
        );
      }

      const sameAsCurrent = await compare(parsed.data.newPassword, user.passwordHash);
      if (sameAsCurrent) {
        return NextResponse.json(
          { message: "Nové heslo se musí lišit od aktuálního." },
          { status: 400 },
        );
      }
    }

    const passwordHash = await hash(parsed.data.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    });

    return NextResponse.json({
      message: hasPassword
        ? "Heslo bylo úspěšně změněno."
        : "Heslo bylo úspěšně nastaveno.",
    });
  } catch (error) {
    console.error("Změna hesla selhala:", error);
    return NextResponse.json(
      { message: "Heslo se nepodařilo změnit." },
      { status: 500 },
    );
  }
}
