import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { ZodError, ZodTypeAny } from "zod";
import { authOptions } from "@/lib/auth";
import { applyRateLimit } from "@/lib/api/rate-limit";

type RateLimitOptions = {
  prefix: string;
  max: number;
  windowMs: number;
  message: string;
};

type RequireAuthedUserInput = {
  request: Request;
  rateLimit?: RateLimitOptions;
};

type ParseJsonWithSchemaInput<TSchema extends ZodTypeAny> = {
  request: Request;
  schema: TSchema;
  getValidationMessage: (error: ZodError) => string;
};

export async function requireAuthedUser(
  input: RequireAuthedUserInput,
): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Nejste přihlášeni." }, { status: 401 });
  }

  if (input.rateLimit) {
    const rateLimited = applyRateLimit({
      request: input.request,
      prefix: input.rateLimit.prefix,
      max: input.rateLimit.max,
      windowMs: input.rateLimit.windowMs,
      userId,
      message: input.rateLimit.message,
    });

    if (rateLimited) {
      return rateLimited;
    }
  }

  return { userId };
}

export async function parseJsonWithSchema<TSchema extends ZodTypeAny>(
  input: ParseJsonWithSchemaInput<TSchema>,
): Promise<{ data: TSchema["_output"] } | NextResponse> {
  let body: unknown;

  try {
    body = (await input.request.json()) as unknown;
  } catch {
    return NextResponse.json(
      { message: "Neplatné tělo požadavku." },
      { status: 400 },
    );
  }

  const parsed = input.schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: input.getValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  return { data: parsed.data };
}
