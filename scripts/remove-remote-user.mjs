#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { z } from "zod";

const args = process.argv.slice(2);
const DEFAULT_REMOTE_HOST = process.env.REMOTE_SSH_HOST || "praha112";
const DEFAULT_REMOTE_APP_DIR =
  process.env.REMOTE_APP_DIR || "/home/maxim/apps/praha211";

const userEmailSchema = z
  .string()
  .trim()
  .email("Zadejte platnou e-mailovou adresu.")
  .transform((value) => value.toLowerCase());

function hasFlag(flag) {
  return args.includes(flag);
}

function getArgValue(flag) {
  const inline = args.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);

  const index = args.indexOf(flag);
  if (index === -1) return undefined;

  const value = args[index + 1];
  if (!value || value.startsWith("--")) return undefined;
  return value;
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function printUsage() {
  console.log(`
Smaže uživatele na remote serveru podle e-mailu.

Použití:
  npm run user:remove:remote -- --email user@example.com

Volitelné:
  --host praha112                      SSH host (výchozí: ${DEFAULT_REMOTE_HOST})
  --app-dir /home/maxim/apps/praha211 Cesta k aplikaci na remote hostu
  --dry-run                            Jen náhled, bez smazání
  --yes                                Potvrzení bez interaktivního dotazu
  --help

Příklady:
  npm run user:remove:remote -- --email user@example.com --dry-run
  npm run user:remove:remote -- --email user@example.com --yes
  npm run user:remove:remote -- --email user@example.com --host my-host
`);
}

function buildRemoteScript(mode) {
  return `
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = Buffer.from(process.env.TARGET_EMAIL_B64 || "", "base64").toString("utf8");
  const users = await prisma.user.findMany({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      teamId: true,
      emailVerifiedAt: true,
      ledTeam: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if ("${mode}" === "delete" && users.length > 0) {
    const removed = await prisma.user.deleteMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    console.log(JSON.stringify({
      mode: "${mode}",
      matchedCount: users.length,
      removedCount: removed.count,
      users,
    }));
    return;
  }

  console.log(JSON.stringify({
    mode: "${mode}",
    matchedCount: users.length,
    removedCount: 0,
    users,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
}

async function runRemoteCommand({ host, appDir, email, mode }) {
  const emailB64 = Buffer.from(email, "utf8").toString("base64");
  const remoteScript = buildRemoteScript(mode);
  const envFilePath = `${appDir}/.env`;
  const remoteCommand = [
    `cd ${shellEscape(appDir)}`,
    `TARGET_EMAIL_B64=${shellEscape(emailB64)} node --env-file=${shellEscape(envFilePath)} -e ${shellEscape(remoteScript)}`,
  ].join(" && ");

  return new Promise((resolve) => {
    const child = spawn("ssh", [host, `bash -lc ${shellEscape(remoteCommand)}`], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdoutText = "";
    let stderrText = "";

    child.stdout.on("data", (chunk) => {
      stdoutText += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderrText += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdoutText: stdoutText.trim(),
        stderrText: stderrText.trim(),
      });
    });
  });
}

function parseRemoteResult(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function printMatchedUsers(users) {
  for (const user of users) {
    const leaderSuffix = user.ledTeam
      ? ` | vede tým: ${user.ledTeam.name} (${user.ledTeam.slug})`
      : "";
    const verifiedSuffix = user.emailVerifiedAt ? "ověřen" : "neověřen";
    const teamSuffix = user.teamId ? ` | teamId: ${user.teamId}` : "";
    console.log(
      `- ${user.email} | id: ${user.id} | role: ${user.role} | ${verifiedSuffix}${teamSuffix}${leaderSuffix}`,
    );
  }
}

async function askForConfirmation(email, matchedCount) {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    const answer = await rl.question(
      `Potvrďte smazání ${matchedCount} uživatele(ů) s e-mailem "${email}" na remote DB (ano/ne): `,
    );

    return answer.trim().toLowerCase() === "ano";
  } finally {
    rl.close();
  }
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  const emailInput = getArgValue("--email");
  const host = getArgValue("--host") || DEFAULT_REMOTE_HOST;
  const appDir = getArgValue("--app-dir") || DEFAULT_REMOTE_APP_DIR;
  const dryRun = hasFlag("--dry-run");
  const skipConfirmation = hasFlag("--yes");

  if (!emailInput) {
    console.error("Chyba: --email je povinný argument.\n");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const parsedEmail = userEmailSchema.safeParse(emailInput);
  if (!parsedEmail.success) {
    const message = parsedEmail.error.issues[0]?.message ?? "Neplatný e-mail.";
    console.error(`Chyba: ${message}`);
    process.exitCode = 1;
    return;
  }

  const email = parsedEmail.data;

  console.log(`Kontroluji remote DB na hostu "${host}" pro e-mail "${email}"...`);

  const preview = await runRemoteCommand({
    host,
    appDir,
    email,
    mode: "dry-run",
  });

  if (preview.code !== 0) {
    console.error("Nepodařilo se načíst data z remote DB.");
    if (preview.stderrText) {
      console.error(preview.stderrText);
    }
    process.exitCode = 1;
    return;
  }

  const previewResult = parseRemoteResult(preview.stdoutText);
  if (!previewResult) {
    console.error("Remote odpověď není validní JSON:");
    console.error(preview.stdoutText || "<prázdná odpověď>");
    process.exitCode = 1;
    return;
  }

  if (previewResult.matchedCount === 0) {
    console.log("Nenalezen žádný uživatel k odstranění.");
    return;
  }

  console.log(`Nalezeno uživatelů: ${previewResult.matchedCount}`);
  printMatchedUsers(previewResult.users);

  if (dryRun) {
    console.log("Dry-run režim: žádná data nebyla změněna.");
    return;
  }

  if (!skipConfirmation) {
    const confirmed = await askForConfirmation(email, previewResult.matchedCount);
    if (!confirmed) {
      console.log("Operace zrušena uživatelem.");
      return;
    }
  }

  const deletion = await runRemoteCommand({
    host,
    appDir,
    email,
    mode: "delete",
  });

  if (deletion.code !== 0) {
    console.error("Smazání uživatele na remote DB selhalo.");
    if (deletion.stderrText) {
      console.error(deletion.stderrText);
    }
    process.exitCode = 1;
    return;
  }

  const deletionResult = parseRemoteResult(deletion.stdoutText);
  if (!deletionResult) {
    console.error("Remote odpověď po smazání není validní JSON:");
    console.error(deletion.stdoutText || "<prázdná odpověď>");
    process.exitCode = 1;
    return;
  }

  console.log(
    `Hotovo. Odstraněno uživatelů: ${deletionResult.removedCount} (nalezeno: ${deletionResult.matchedCount}).`,
  );
}

main().catch((error) => {
  console.error("Skript selhal:", error);
  process.exitCode = 1;
});
