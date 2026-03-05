#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "REGISTRATION_CODE",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "HEALTHCHECK_SECRET",
  "CRON_SECRET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

const OPTIONAL_KEYS = [
  "RESEND_CONTACT_TO",
  "NEXT_PUBLIC_UMAMI_SCRIPT_URL",
  "NEXT_PUBLIC_UMAMI_WEBSITE_ID",
  "R2_ENDPOINT",
  "CLAIM_VALIDATION_LOCK_STALE_MS",
  "LOCAL_SELFIE_VALIDATION_TIMEOUT_MS",
  "CLAIM_VALIDATION_CRON_BATCH_SIZE",
];

const RUNBOOK_STEPS = [
  { label: "prisma:generate", command: "npm", args: ["run", "prisma:generate"] },
  { label: "prisma:migrate", command: "npm", args: ["run", "prisma:migrate"] },
  { label: "lint", command: "npm", args: ["run", "lint"] },
  { label: "build", command: "npm", args: ["run", "build"] },
  {
    label: "test:integration:all",
    command: "npm",
    args: ["run", "test:integration:all"],
    env: { CI: "true" },
  },
  { label: "r2:smoke", command: "npm", args: ["run", "r2:smoke"] },
];

const argv = process.argv.slice(2);
const flags = new Set(argv);
const help = flags.has("--help") || flags.has("-h");
const runbook = flags.has("--runbook");
const allowLocal = flags.has("--allow-local");

function printHelp() {
  console.log(
    [
      "Použití:",
      "  node scripts/predeploy-check.mjs [--runbook] [--allow-local]",
      "",
      "Parametry:",
      "  --runbook      Po úspěšném env gate spustí celý predeploy runbook.",
      "  --allow-local  Povolit localhost URL a lokální DB host (jen pro test).",
      "  --help         Nápověda.",
    ].join("\n"),
  );
}

function parseDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Map();
  }

  const content = fs.readFileSync(filePath, "utf8");
  const map = new Map();

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalIndex = rawLine.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const key = rawLine.slice(0, equalIndex).trim();
    let value = rawLine.slice(equalIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }

  return map;
}

function getResolvedEnvValue(envMap, key) {
  const processValue = process.env[key];
  if (typeof processValue === "string" && processValue.length > 0) {
    return processValue.trim();
  }

  const fileValue = envMap.get(key);
  if (typeof fileValue === "string") {
    return fileValue.trim();
  }

  return "";
}

function looksLikePlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("replace-with")
    || normalized.includes("changeme")
    || normalized.includes("example.com")
    || normalized.includes("replace_me")
    || normalized.includes("your-website-id")
  );
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLocalHostName(hostname) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function validateResolvedConfig(envMap, options) {
  const errors = [];
  const warnings = [];

  for (const key of REQUIRED_KEYS) {
    const value = getResolvedEnvValue(envMap, key);
    if (!value) {
      errors.push(`${key}: chybí nebo je prázdná hodnota.`);
      continue;
    }
    if (looksLikePlaceholder(value)) {
      errors.push(`${key}: obsahuje placeholder hodnotu.`);
    }
  }

  const databaseUrl = getResolvedEnvValue(envMap, "DATABASE_URL");
  if (databaseUrl) {
    if (databaseUrl === "postgresql://postgres:postgres@localhost:5432/praha211?schema=public") {
      errors.push("DATABASE_URL: používá lokální default hodnotu.");
    } else {
      const parsedDb = parseUrl(databaseUrl);
      if (parsedDb && isLocalHostName(parsedDb.hostname) && !options.allowLocal) {
        errors.push("DATABASE_URL: host je lokální (localhost/127.0.0.1/::1).");
      }
    }
  }

  for (const key of ["NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const value = getResolvedEnvValue(envMap, key);
    if (!value) {
      continue;
    }

    const parsed = parseUrl(value);
    if (!parsed) {
      errors.push(`${key}: není platná URL.`);
      continue;
    }
    if (parsed.protocol !== "https:" && !options.allowLocal) {
      errors.push(`${key}: musí být https URL.`);
    }
    if (isLocalHostName(parsed.hostname) && !options.allowLocal) {
      errors.push(`${key}: nesmí být localhost v produkci.`);
    }
  }

  const nextAuthSecret = getResolvedEnvValue(envMap, "NEXTAUTH_SECRET");
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    errors.push("NEXTAUTH_SECRET: doporučeno minimálně 32 znaků.");
  }

  const healthSecret = getResolvedEnvValue(envMap, "HEALTHCHECK_SECRET");
  if (healthSecret && healthSecret.length < 16) {
    errors.push("HEALTHCHECK_SECRET: doporučeno minimálně 16 znaků.");
  }

  const cronSecret = getResolvedEnvValue(envMap, "CRON_SECRET");
  if (cronSecret && cronSecret.length < 16) {
    errors.push("CRON_SECRET: doporučeno minimálně 16 znaků.");
  }

  const registrationCode = getResolvedEnvValue(envMap, "REGISTRATION_CODE");
  if (registrationCode) {
    if (registrationCode.toLowerCase() === "sokol") {
      errors.push("REGISTRATION_CODE: nesmí používat default hodnotu 'sokol' pro produkci.");
    }
    if (registrationCode.length < 6) {
      warnings.push("REGISTRATION_CODE: doporučeno alespoň 6 znaků.");
    }
  }

  const resendApiKey = getResolvedEnvValue(envMap, "RESEND_API_KEY");
  if (resendApiKey && !resendApiKey.startsWith("re_")) {
    warnings.push("RESEND_API_KEY: neočekávaný formát (obvykle začíná 're_').");
  }

  const optionalMissing = OPTIONAL_KEYS.filter(
    (key) => getResolvedEnvValue(envMap, key).length === 0,
  );
  if (optionalMissing.length > 0) {
    warnings.push(`Volitelné proměnné nejsou nastavené: ${optionalMissing.join(", ")}`);
  }

  return { errors, warnings };
}

function runStep(step) {
  const mergedEnv = {
    ...process.env,
    ...(step.env ?? {}),
  };

  console.log(`\n==> ${step.label}`);
  const result = spawnSync(step.command, step.args, {
    stdio: "inherit",
    env: mergedEnv,
  });

  if (result.status !== 0) {
    throw new Error(`Krok '${step.label}' selhal (exit code ${result.status ?? "unknown"}).`);
  }
}

function main() {
  if (help) {
    printHelp();
    return;
  }

  const envPath = path.join(process.cwd(), ".env");
  const envMap = parseDotEnvFile(envPath);
  const { errors, warnings } = validateResolvedConfig(envMap, { allowLocal });

  console.log("==> Produkční env gate");
  if (errors.length === 0) {
    console.log("PASS: Povinné env kontroly prošly.");
  } else {
    console.log("FAIL: Povinné env kontroly selhaly:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  }

  if (warnings.length > 0) {
    console.log("\nUpozornění:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  if (!runbook) {
    return;
  }

  console.log("\n==> Spouštím predeploy runbook");
  for (const step of RUNBOOK_STEPS) {
    runStep(step);
  }
  console.log("\nPASS: Predeploy runbook doběhl úspěšně.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
