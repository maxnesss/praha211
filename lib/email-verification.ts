import { createHash, randomBytes } from "node:crypto";
import { getSiteUrl } from "@/lib/seo";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TTL_MS = 2 * 60 * 60 * 1000;

type SendVerificationEmailInput = {
  email: string;
  token: string;
};

type SendWelcomeEmailInput = {
  email: string;
};

type SendPasswordResetEmailInput = {
  email: string;
  token: string;
};

type SendContactEmailInput = {
  name: string;
  email: string;
  topicLabel: string;
  message: string;
  submittedAt?: Date;
};

type VerificationEmailTemplateInput = {
  verificationUrl: string;
};

type PasswordResetEmailTemplateInput = {
  resetUrl: string;
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

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken() {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
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

export function buildPasswordResetUrl({
  email,
  token,
}: SendPasswordResetEmailInput) {
  const url = new URL("/reset-hesla", getSiteUrl());
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
  const logoUrl = new URL("/logo/praha-tr.webp", siteUrl).toString();
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

function buildPasswordResetEmailText(input: PasswordResetEmailTemplateInput) {
  return [
    "PRAHA 112",
    "",
    "Požádali jste o reset hesla.",
    "Pro nastavení nového hesla otevřete tento odkaz:",
    input.resetUrl,
    "",
    "Platnost odkazu je 2 hodiny.",
    "",
    "Pokud jste o reset nežádali, tento e-mail můžete ignorovat.",
  ].join("\n");
}

function buildPasswordResetEmailHtml(input: PasswordResetEmailTemplateInput) {
  const siteUrl = getSiteUrl();
  const logoUrl = new URL("/logo/praha-tr.webp", siteUrl).toString();
  const signInUrl = new URL("/sign-in", siteUrl).toString();

  return `
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PRAHA 112: Reset hesla</title>
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
                <h1 style="margin:12px 0 0;color:#ecfeff;font-size:32px;line-height:1.15;font-weight:700;">Reset hesla</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 0;text-align:center;">
                <p style="margin:0;color:#c9eef6;font-size:16px;line-height:1.6;">
                  Požádali jste o obnovu hesla. Klikněte na tlačítko níže a nastavte si nové heslo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0;text-align:center;">
                <a href="${input.resetUrl}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#22d3ee;color:#06202b;text-decoration:none;font-size:16px;font-weight:700;">
                  Nastavit nové heslo
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;text-align:center;">
                <p style="margin:0;color:#9cc3ce;font-size:14px;line-height:1.6;">
                  Odkaz je platný 2 hodiny.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 0;text-align:center;">
                <p style="margin:0;color:#9cc3ce;font-size:13px;line-height:1.6;word-break:break-word;">
                  Pokud tlačítko nefunguje, použijte tento odkaz:<br />
                  <a href="${input.resetUrl}" style="color:#67e8f9;text-decoration:underline;">${input.resetUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px;text-align:center;">
                <p style="margin:0;color:#86aebb;font-size:12px;line-height:1.6;">
                  Pokud jste o reset nežádali, e-mail můžete ignorovat.<br />
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
  const logoUrl = new URL("/logo/praha-tr.webp", siteUrl).toString();
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

function extractEmailAddress(value: string) {
  const trimmed = value.trim();
  const angleMatch = trimmed.match(/<([^<>@\s]+@[^<>@\s]+)>/);

  if (angleMatch?.[1]) {
    return angleMatch[1];
  }

  const plainMatch = trimmed.match(/^[^<>\s@]+@[^<>\s@]+$/);
  return plainMatch ? trimmed : null;
}

function getContactRecipientEmail() {
  const explicitRecipient = process.env.RESEND_CONTACT_TO?.trim();
  if (explicitRecipient) {
    return explicitRecipient;
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    return null;
  }

  return extractEmailAddress(from);
}

function formatContactSubmittedAt(date: Date) {
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/Prague",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildContactEmailText(input: {
  name: string;
  email: string;
  topicLabel: string;
  message: string;
  submittedAt: Date;
}) {
  return [
    "PRAHA 112",
    "",
    "Nová zpráva z formuláře Kontaktujte nás.",
    "",
    `Jméno: ${input.name}`,
    `E-mail: ${input.email}`,
    `Předmět: ${input.topicLabel}`,
    `Odesláno: ${formatContactSubmittedAt(input.submittedAt)}`,
    "",
    "Zpráva:",
    input.message,
  ].join("\n");
}

function buildContactEmailHtml(input: {
  name: string;
  email: string;
  topicLabel: string;
  message: string;
  submittedAt: Date;
}) {
  const submittedAt = escapeHtml(formatContactSubmittedAt(input.submittedAt));
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const topicLabel = escapeHtml(input.topicLabel);
  const message = escapeHtml(input.message).replaceAll("\n", "<br />");

  return `
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PRAHA 112: Nová kontaktní zpráva</title>
  </head>
  <body style="margin:0;padding:0;background:#06141d;color:#e6fbff;font-family:Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#06141d;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#0c202e;border:1px solid rgba(34,211,238,0.35);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 14px;text-align:left;">
                <p style="margin:0 0 14px;color:#a5f3fc;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">PRAHA 112</p>
                <h1 style="margin:0;color:#ecfeff;font-size:30px;line-height:1.15;font-weight:700;">Nová kontaktní zpráva</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 14px;text-align:left;">
                <p style="margin:0;color:#c9eef6;font-size:14px;line-height:1.7;">
                  <strong>Jméno:</strong> ${name}<br />
                  <strong>E-mail:</strong> ${email}<br />
                  <strong>Předmět:</strong> ${topicLabel}<br />
                  <strong>Odesláno:</strong> ${submittedAt}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;text-align:left;">
                <p style="margin:0 0 8px;color:#a5f3fc;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Zpráva</p>
                <div style="background:#08161f;border:1px solid rgba(34,211,238,0.25);border-radius:12px;padding:14px;color:#d2f3f9;font-size:15px;line-height:1.7;white-space:normal;">
                  ${message}
                </div>
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
  replyTo?: string;
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
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
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

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
) {
  const resetUrl = buildPasswordResetUrl(input);
  const templateInput = { resetUrl };

  await sendResendEmail({
    to: input.email,
    subject: "PRAHA 112: Reset hesla",
    text: buildPasswordResetEmailText(templateInput),
    html: buildPasswordResetEmailHtml(templateInput),
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

export async function sendContactEmail(input: SendContactEmailInput) {
  const recipient = getContactRecipientEmail();
  if (!recipient) {
    throw new Error("Chybí RESEND_CONTACT_TO nebo platná adresa v RESEND_FROM.");
  }

  const submittedAt = input.submittedAt ?? new Date();
  const templateInput = {
    name: input.name,
    email: input.email,
    topicLabel: input.topicLabel,
    message: input.message,
    submittedAt,
  };

  await sendResendEmail({
    to: recipient,
    replyTo: input.email,
    subject: `PRAHA 112: Kontakt - ${input.topicLabel}`,
    text: buildContactEmailText(templateInput),
    html: buildContactEmailHtml(templateInput),
  });
}
