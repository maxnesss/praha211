import { z } from "zod";

export const districtClaimSchema = z.object({
  selfieUrl: z
    .string()
    .trim()
    .url("Selfie URL must be a valid URL.")
    .max(500, "Selfie URL is too long."),
  attestVisited: z
    .boolean()
    .refine((value) => value, "You must confirm physical visit."),
  attestSignVisible: z
    .boolean()
    .refine((value) => value, "You must confirm the official sign is visible."),
});

export function getValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request.";
}
