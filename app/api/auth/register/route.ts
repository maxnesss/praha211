import { MessageCategory, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import {
  createEmailVerificationToken,
  sendEmailVerificationEmail,
} from "@/lib/email-verification";
import { isNicknameTaken } from "@/lib/nickname-utils";
import { DEFAULT_USER_AVATAR } from "@/lib/profile-avatars";
import { prisma } from "@/lib/prisma";
import { getFirstZodErrorMessage, registerSchema } from "@/lib/validation/auth";

const TEST_AUTOMATION_EMAIL_DOMAIN = "@tests.praha112.local";
const GENERIC_REGISTRATION_FOLLOWUP_MESSAGE =
  "Pokud je to potřeba, poslali jsme na zadaný e-mail pokyny pro dokončení registrace.";
const WELCOME_OVERVIEW_MESSAGE = {
  title: "Vítejte v PRAHA 112",
  body: [
    "Vítejte ve hře PRAHA 112.",
    "",
    "Cílem je odemknout všech 112 pražských katastrálních území.",
    "Postup, skóre i denní sérii najdete v přehledu Radnice.",
    "",
    "Přejeme hodně štěstí při první kapitole.",
  ].join("\n"),
};
const WELCOME_RULES_MESSAGE = {
  title: "Pravidla hry v kostce",
  body: [
    "1) U městské části vždy odešlete selfie se značkou.",
    "2) Každou městskou část lze potvrdit jen jednou.",
    "3) Dokončení je konečné: 112/112.",
    "4) Skóre je otevřená soutěž: základ + denní násobitel + bonus za sérii.",
    "",
    "Hrajte fair play a bezpečně.",
  ].join("\n"),
};

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

        const { email, password, name, nickname, privacyPolicyAccepted } = parsed.data;
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

        const nicknameTaken = await isNicknameTaken(nickname);
        if (nicknameTaken) {
          return NextResponse.json(
            { message: "Tuto přezdívku už používá jiný hráč." },
            { status: 409 },
          );
        }

        const verificationToken = createEmailVerificationToken();
        const passwordHash = await hash(password, 12);

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

        try {
          await prisma.userMessage.createMany({
            data: [
              {
                recipientUserId: user.id,
                senderUserId: null,
                category: MessageCategory.SYSTEM,
                title: WELCOME_OVERVIEW_MESSAGE.title,
                body: WELCOME_OVERVIEW_MESSAGE.body,
                dedupeKey: "system:welcome-overview:v1",
              },
              {
                recipientUserId: user.id,
                senderUserId: null,
                category: MessageCategory.SYSTEM,
                title: WELCOME_RULES_MESSAGE.title,
                body: WELCOME_RULES_MESSAGE.body,
                dedupeKey: "system:welcome-rules:v1",
              },
            ],
            skipDuplicates: true,
          });
        } catch (error) {
          console.error("Vytvoření uvítacích zpráv po registraci selhalo:", error);
        }

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
          const target = Array.isArray(error.meta?.target)
            ? error.meta.target.map((value) => String(value))
            : [];
          if (target.includes("nickname")) {
            return NextResponse.json(
              { message: "Tuto přezdívku už používá jiný hráč." },
              { status: 409 },
            );
          }

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
