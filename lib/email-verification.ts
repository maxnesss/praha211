import { createHash, randomBytes } from "node:crypto";
import { getSiteUrl } from "@/lib/seo";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

type SendVerificationEmailInput = {
  email: string;
  token: string;
};

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createEmailVerificationToken() {
  const token = randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export function buildEmailVerificationUrl({
  email,
  token,
}: SendVerificationEmailInput) {
  const url = new URL("/api/auth/verify-email", getSiteUrl());
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function sendEmailVerificationEmail(
  input: SendVerificationEmailInput,
) {
  const config = getResendConfig();
  if (!config) {
    throw new Error("Chybí RESEND_API_KEY nebo RESEND_FROM.");
  }

  const verificationUrl = buildEmailVerificationUrl(input);

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.email],
      subject: "PRAHA 112: Ověření e-mailu",
      text:
        "Děkujeme za registraci do PRAHA 112.\n\n"
        + `Pro aktivaci účtu otevřete tento odkaz:\n${verificationUrl}\n\n`
        + "Pokud jste si účet nevytvořili, tuto zprávu ignorujte.",
      html:
        "<p>Děkujeme za registraci do <strong>PRAHA 112</strong>.</p>"
        + `<p>Pro aktivaci účtu klikněte na tento odkaz: <a href="${verificationUrl}">Ověřit e-mail</a>.</p>`
        + "<p>Pokud jste si účet nevytvořili, tuto zprávu ignorujte.</p>",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend API vrátila chybu ${response.status}: ${body || "bez těla odpovědi"}`,
    );
  }
}
