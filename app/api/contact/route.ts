import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import {
  contactFormSchema,
  getContactValidationMessage,
} from "@/lib/validation/contact";

export async function POST(request: Request) {
  const rateLimited = applyRateLimit({
    request,
    prefix: "contact",
    max: 8,
    windowMs: 10 * 60 * 1000,
    message: "Příliš mnoho zpráv v krátkém čase. Zkuste to prosím později.",
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

    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: getContactValidationMessage(parsed.error) },
        { status: 400 },
      );
    }

    const { name, email, topic } = parsed.data;

    console.info("Nová kontaktní zpráva:", { name, email, topic });

    return NextResponse.json(
      { message: "Děkujeme, zpráva byla přijata." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Kontakt formulář selhal:", error);

    return NextResponse.json(
      { message: "Nepodařilo se odeslat zprávu." },
      { status: 500 },
    );
  }
}
