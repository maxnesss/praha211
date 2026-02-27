import { z } from "zod";
import { isSelfieObjectKey } from "@/lib/selfie-upload-rules";

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const districtClaimSchema = z.object({
  selfieUrl: z
    .string()
    .trim()
    .max(500, "Odkaz na selfie je příliš dlouhý.")
    .refine(
      (value) => isHttpUrl(value) || isSelfieObjectKey(value),
      "Selfie musí být platná URL nebo interní klíč úložiště.",
    ),
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
