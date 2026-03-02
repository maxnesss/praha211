import { createHash, randomBytes } from "node:crypto";
import { getSiteUrl } from "@/lib/seo";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

type SendVerificationEmailInput = {
  email: string;
  token: string;
};

type SendWelcomeEmailInput = {
  email: string;
};

type VerificationEmailTemplateInput = {
  verificationUrl: string;
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

function buildVerificationEmailText(input: VerificationEmailTemplateInput) {
  return [
    "PRAHA 112",
    "",
    "Děkujeme za registraci.",
    "Pro aktivaci účtu potvrďte svůj e-mail na tomto odkazu:",
    input.verificationUrl,
    "",
    "Platnost odkazu je 24 hodin.",
    "",
    "Pokud jste si účet nevytvořili, tento e-mail můžete ignorovat.",
  ].join("\n");
}

function buildVerificationEmailHtml(input: VerificationEmailTemplateInput) {
  const siteUrl = getSiteUrl();
  const logoUrl = new URL("/logo/praha-tr.png", siteUrl).toString();
  const signInUrl = new URL("/sign-in", siteUrl).toString();

  return `
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PRAHA 112: Ověření e-mailu</title>
  </head>
  <body style="margin:0;padding:0;background:#06141d;color:#e6fbff;font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#06141d;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#0c202e;border:1px solid rgba(34,211,238,0.35);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 10px;text-align:center;">
                <img src="${logoUrl}" alt="PRAHA 112" width="170" height="170" style="display:block;margin:0 auto;width:170px;height:170px;max-width:100%;object-fit:contain;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;text-align:center;">
                <p style="margin:0;color:#a5f3fc;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">PRAHA 112</p>
                <h1 style="margin:12px 0 0;color:#ecfeff;font-size:32px;line-height:1.15;font-weight:700;">Ověřte svůj e-mail</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;text-align:center;">
                <p style="margin:0;color:#c9eef6;font-size:16px;line-height:1.6;">
                  Děkujeme za registraci. Pro aktivaci účtu klikněte na tlačítko níže.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0;text-align:center;">
                <a href="${input.verificationUrl}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#22d3ee;color:#06202b;text-decoration:none;font-size:16px;font-weight:700;">
                  Ověřit e-mail
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;text-align:center;">
                <p style="margin:0;color:#9cc3ce;font-size:14px;line-height:1.6;">
                  Odkaz je platný 24 hodin.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 0;text-align:center;">
                <p style="margin:0;color:#9cc3ce;font-size:13px;line-height:1.6;word-break:break-word;">
                  Pokud tlačítko nefunguje, použijte tento odkaz:<br />
                  <a href="${input.verificationUrl}" style="color:#67e8f9;text-decoration:underline;">${input.verificationUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px;text-align:center;">
                <p style="margin:0;color:#86aebb;font-size:12px;line-height:1.6;">
                  Pokud jste si účet nevytvořili, e-mail můžete ignorovat.<br />
                  <a href="${signInUrl}" style="color:#86aebb;text-decoration:underline;">www.praha112.cz</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

function buildWelcomeEmailText() {
  return [
    "PRAHA 112",
    "",
    "Vítejte ve hře PRAHA 112.",
    "Váš e-mail je ověřený a účet je aktivní.",
    "",
    "Jak hra funguje:",
    "1) Cílem je odemknout všech 112 pražských katastrálních území.",
    "2) Za každé potvrzení získáváte body, denní bonusy a sérii.",
    "3) Postup sledujete v přehledu /radnice a v kapitolách.",
    "",
    "Přihlaste se a začněte první částí.",
    "",
    "Těšíme se na vaši první kapitolu.",
  ].join("\n");
}

function buildWelcomeEmailHtml() {
  const siteUrl = getSiteUrl();
  const logoUrl = new URL("/logo/praha-tr.png", siteUrl).toString();
  const signInUrl = new URL("/sign-in", siteUrl).toString();
  const dashboardUrl = new URL("/radnice", siteUrl).toString();

  return `
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PRAHA 112: Vítejte</title>
  </head>
  <body style="margin:0;padding:0;background:#06141d;color:#e6fbff;font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#06141d;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#0c202e;border:1px solid rgba(34,211,238,0.35);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 10px;text-align:center;">
                <img src="${logoUrl}" alt="PRAHA 112" width="170" height="170" style="display:block;margin:0 auto;width:170px;height:170px;max-width:100%;object-fit:contain;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;text-align:center;">
                <p style="margin:0;color:#a5f3fc;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">PRAHA 112</p>
                <h1 style="margin:12px 0 0;color:#ecfeff;font-size:32px;line-height:1.15;font-weight:700;">Vítejte ve hře</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;text-align:center;">
                <p style="margin:0;color:#c9eef6;font-size:16px;line-height:1.6;">
                  Váš e-mail je ověřený a účet je aktivní. Teď můžete vyrazit za prvními body.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;text-align:left;">
                <p style="margin:0;color:#c9eef6;font-size:15px;line-height:1.65;">
                  <strong>Jak hra funguje:</strong><br />
                  1) Cílem je odemknout všech 112 pražských katastrálních území.<br />
                  2) Za každé potvrzení získáváte body, denní bonusy a sérii.<br />
                  3) Postup sledujete v přehledu <strong>Radnice</strong> a v kapitolách.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0;text-align:center;">
                <a href="${dashboardUrl}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#fb923c;color:#1c0e05;text-decoration:none;font-size:16px;font-weight:700;">
                  Otevřít radnici
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px;text-align:center;">
                <p style="margin:0;color:#86aebb;font-size:12px;line-height:1.6;">
                  Pokud nejste přihlášení, nejdřív otevřete <a href="${signInUrl}" style="color:#86aebb;text-decoration:underline;">přihlášení</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const config = getResendConfig();
  if (!config) {
    throw new Error("Chybí RESEND_API_KEY nebo RESEND_FROM.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend API vrátila chybu ${response.status}: ${body || "bez těla odpovědi"}`,
    );
  }
}

export async function sendEmailVerificationEmail(
  input: SendVerificationEmailInput,
) {
  const verificationUrl = buildEmailVerificationUrl(input);
  const templateInput = { verificationUrl };

  await sendResendEmail({
    to: input.email,
    subject: "PRAHA 112: Ověření e-mailu",
    text: buildVerificationEmailText(templateInput),
    html: buildVerificationEmailHtml(templateInput),
  });
}

export async function sendWelcomeEmail(input: SendWelcomeEmailInput) {
  await sendResendEmail({
    to: input.email,
    subject: "PRAHA 112: Vítejte",
    text: buildWelcomeEmailText(),
    html: buildWelcomeEmailHtml(),
  });
}
