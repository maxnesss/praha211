import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Please provide a valid email address.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

const nameSchema = z
  .string()
  .trim()
  .max(100, "Name must be 100 characters or fewer.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const userRoleSchema = z.enum(["ADMIN", "USER"]);

export const addUserSchema = registerSchema.extend({
  role: userRoleSchema.default("USER"),
});

export function getFirstZodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}
