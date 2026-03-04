import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  createEmailVerificationToken,
  sendEmailVerificationEmail,
} from "@/lib/email-verification";
import { generateUniqueNickname } from "@/lib/nickname-utils";
import { DEFAULT_USER_AVATAR } from "@/lib/profile-avatars";
import { prisma } from "@/lib/prisma";
import { getFirstZodErrorMessage, registerSchema } from "@/lib/validation/auth";

const TEST_AUTOMATION_EMAIL_DOMAIN = "@tests.praha112.local";
const GENERIC_REGISTRATION_FOLLOWUP_MESSAGE =
  "Pokud je to potřeba, poslali jsme na zadaný e-mail pokyny pro dokončení registrace.";

function shouldSkipVerificationEmailDelivery(email: string) {
  return email.endsWith(TEST_AUTOMATION_EMAIL_DOMAIN);
}

async function rotateVerificationTokenAndSend(input: {
  userId: string;
  email: string;
  skipEmailDelivery?: boolean;
}) {
  const verificationToken = createEmailVerificationToken();

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      emailVerificationTokenHash: verificationToken.tokenHash,
      emailVerificationTokenExpiresAt: verificationToken.expiresAt,
    },
  });

  if (input.skipEmailDelivery) {
    return;
  }

  await sendEmailVerificationEmail({
    email: input.email,
    token: verificationToken.token,
  });
}

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "auth.register" },
    async () => {
      const genericFollowupResponse = () =>
        NextResponse.json(
          {
            message: GENERIC_REGISTRATION_FOLLOWUP_MESSAGE,
          },
          { status: 200 },
        );

      const rateLimited = await applyRateLimit({
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

        const { email, password, name, privacyPolicyAccepted } = parsed.data;
        const skipEmailDelivery = shouldSkipVerificationEmailDelivery(email);

        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, emailVerifiedAt: true },
        });

        if (existingUser) {
          if (!existingUser.emailVerifiedAt) {
            try {
              await rotateVerificationTokenAndSend({
                userId: existingUser.id,
                email: existingUser.email,
                skipEmailDelivery: shouldSkipVerificationEmailDelivery(existingUser.email),
              });
            } catch (error) {
              console.error("Odeslání ověřovacího e-mailu při opakované registraci selhalo:", error);
            }
          }

          return genericFollowupResponse();
        }

        const verificationToken = createEmailVerificationToken();
        const passwordHash = await hash(password, 12);

        const nickname = await generateUniqueNickname(name ?? null);

        const user = await prisma.user.create({
          data: {
            email,
            name: name ?? null,
            nickname,
            avatar: DEFAULT_USER_AVATAR,
            passwordHash,
            role: "USER",
            emailVerificationTokenHash: verificationToken.tokenHash,
            emailVerificationTokenExpiresAt: verificationToken.expiresAt,
            privacyPolicyAcceptedAt: privacyPolicyAccepted ? new Date() : null,
          },
          select: { id: true, email: true },
        });

        if (!skipEmailDelivery) {
          try {
            await sendEmailVerificationEmail({
              email: user.email,
              token: verificationToken.token,
            });
          } catch (error) {
            console.error("Odeslání ověřovacího e-mailu po registraci selhalo:", error);

            return NextResponse.json(
              {
                message:
                  "Účet byl vytvořen, ale nepodařilo se odeslat ověřovací e-mail. Zkuste registraci se stejným e-mailem za chvíli znovu.",
              },
              { status: 500 },
            );
          }
        }

        return NextResponse.json(
          {
            message:
              "Účet byl vytvořen. Pro dokončení registrace potvrďte odkaz v ověřovacím e-mailu.",
          },
          { status: 201 },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === "P2002"
        ) {
          return genericFollowupResponse();
        }

        console.error("Registrace se nezdařila:", error);

        return NextResponse.json(
          { message: "Nepodařilo se zaregistrovat účet." },
          { status: 500 },
        );
      }
    },
  );
}
