import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFirstZodErrorMessage, registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = (await request.json()) as unknown;
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
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
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        role: "USER",
      },
      select: { id: true },
    });

    return NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      { message: "Unable to register account." },
      { status: 500 },
    );
  }
}
