import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Zadejte platnou e-mailovou adresu.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Heslo musí mít alespoň 8 znaků.");

const registrationCodeSchema = z
  .string()
  .trim()
  .min(1, "Registrační kód je povinný.")
  .transform((value) => value.toLowerCase())
  .refine((value) => value === "sokol", "Neplatný registrační kód.");

const nameSchema = z
  .string()
  .trim()
  .max(100, "Jméno může mít maximálně 100 znaků.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const privacyPolicyAcceptedSchema = z
  .boolean()
  .refine((value) => value, "Pro registraci je nutné potvrdit ochranu osobních údajů.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Heslo je povinné."),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  registrationCode: registrationCodeSchema,
  privacyPolicyAccepted: privacyPolicyAcceptedSchema,
});

export const userRoleSchema = z.enum(["ADMIN", "USER"]);

export const addUserSchema = registerSchema.extend({
  privacyPolicyAccepted: privacyPolicyAcceptedSchema.default(true),
  role: userRoleSchema.default("USER"),
});

export function getFirstZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
