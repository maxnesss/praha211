#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();
const args = process.argv.slice(2);

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

function printUsage() {
  console.log(`
Přidá uživatele do databáze.

Použití:
  npm run user:add -- --email you@example.com --password "YourPass123"

Volitelné:
  --name "Celé jméno"
  --role USER|ADMIN (výchozí: USER)
  --help

Příklady:
  npm run user:add -- --email admin@praha211.com --password "AdminPass123" --role ADMIN --name "Admin"
  npm run user:add -- --email user@praha211.com --password "UserPass123"
`);
}

const addUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Zadejte platnou e-mailovou adresu.")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků."),
  name: z
    .string()
    .trim()
    .max(100, "Jméno může mít maximálně 100 znaků.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printUsage();
    return;
  }

  const emailInput = getArgValue("--email");
  const password = getArgValue("--password");
  const nameInput = getArgValue("--name");
  const roleInput = (getArgValue("--role") || "USER").toUpperCase();

  if (!emailInput || !password) {
    console.error("Chyba: --email a --password jsou povinné.\n");
    printUsage();
    process.exitCode = 1;
    return;
  }

  const parsed = addUserSchema.safeParse({
    email: emailInput,
    password,
    name: nameInput,
    role: roleInput,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Neplatný vstup.";
    console.error(`Chyba: ${message}`);
    process.exitCode = 1;
    return;
  }

  const { email, password: normalizedPassword, name, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    console.error(`Chyba: Uživatel s e-mailem "${email}" už existuje.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hash(normalizedPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  console.log("Uživatel byl úspěšně vytvořen:");
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error("Nepodařilo se přidat uživatele:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
