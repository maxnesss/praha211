import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Zadejte platnou e-mailovou adresu.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Heslo musí mít alespoň 8 znaků.");

export const verificationTokenSchema = z
  .string()
  .trim()
  .min(1, "Ověřovací token je povinný.")
  .max(256, "Ověřovací token je příliš dlouhý.");

const registrationCodeSchema = z
  .string()
  .trim()
  .min(1, "Registrační kód je povinný.")
  .max(64, "Registrační kód je příliš dlouhý.");

const nameSchema = z
  .string()
  .trim()
  .max(100, "Jméno může mít maximálně 100 znaků.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Přezdívka musí mít alespoň 2 znaky.")
  .max(40, "Přezdívka může mít maximálně 40 znaků.")
  .refine((value) => !/\s/.test(value), "Přezdívka nesmí obsahovat mezery.");

const privacyPolicyAcceptedSchema = z
  .boolean()
  .refine((value) => value, "Pro registraci je nutné potvrdit ochranu osobních údajů.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Heslo je povinné."),
});

export const registerSchema = z.object({
  name: nameSchema,
  nickname: nicknameSchema,
  email: emailSchema,
  password: passwordSchema,
  registrationCode: registrationCodeSchema,
  privacyPolicyAccepted: privacyPolicyAcceptedSchema,
});

export const verifyEmailQuerySchema = z.object({
  email: emailSchema,
  token: verificationTokenSchema,
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
  email: emailSchema,
  token: verificationTokenSchema,
  password: passwordSchema,
});

export const userRoleSchema = z.enum(["ADMIN", "USER"]);

export const addUserSchema = registerSchema.extend({
  privacyPolicyAccepted: privacyPolicyAcceptedSchema.default(true),
  role: userRoleSchema.default("USER"),
});

export function getFirstZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
