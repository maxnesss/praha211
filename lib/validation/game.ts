import { z } from "zod";

export const districtClaimSchema = z.object({
  selfieUrl: z
    .string()
    .trim()
    .url("URL selfie musí být platná adresa.")
    .max(500, "URL selfie je příliš dlouhá."),
  attestVisited: z
    .boolean()
    .refine((value) => value, "Musíte potvrdit fyzickou návštěvu."),
  attestSignVisible: z
    .boolean()
    .refine((value) => value, "Musíte potvrdit, že je vidět oficiální cedule."),
});

export function getValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný požadavek.";
}
