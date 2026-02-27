import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { generateUniqueNickname } from "@/lib/nickname-utils";
import { DEFAULT_USER_AVATAR } from "@/lib/profile-avatars";
import { prisma } from "@/lib/prisma";
import { getFirstZodErrorMessage, registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const rateLimited = applyRateLimit({
    request,
    prefix: "auth-register",
    max: 6,
    windowMs: 15 * 60 * 1000,
    message: "Příliš mnoho pokusů o registraci. Zkuste to prosím později.",
  });
  if (rateLimited) {
    return rateLimited;
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

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: getFirstZodErrorMessage(parsed.error) },
        { status: 400 },
      );
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Účet s tímto e-mailem už existuje." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    const nickname = await generateUniqueNickname(name ?? null);

    await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        nickname,
        avatar: DEFAULT_USER_AVATAR,
        passwordHash,
        role: "USER",
      },
      select: { id: true },
    });

    return NextResponse.json(
      { message: "Účet byl úspěšně vytvořen." },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Účet s tímto e-mailem nebo přezdívkou už existuje." },
        { status: 409 },
      );
    }

    console.error("Registrace se nezdařila:", error);

    return NextResponse.json(
      { message: "Nepodařilo se zaregistrovat účet." },
      { status: 500 },
    );
  }
}
