import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getProfileValidationMessage,
  updateAvatarSchema,
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

    const parsed = updateAvatarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: getProfileValidationMessage(parsed.error) },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: parsed.data.avatar },
      select: { id: true },
    });

    return NextResponse.json({ message: "Avatar byl uložen." });
  } catch (error) {
    console.error("Uložení avataru selhalo:", error);
    return NextResponse.json(
      { message: "Avatar se nepodařilo uložit." },
      { status: 500 },
    );
  }
}
