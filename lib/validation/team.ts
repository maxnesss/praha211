import { z } from "zod";
import { toTeamSlug } from "@/lib/team-utils";

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Název týmu musí mít alespoň 2 znaky.")
    .max(40, "Název týmu může mít maximálně 40 znaků.")
    .refine((value) => toTeamSlug(value).length >= 2, "Název týmu je neplatný."),
});

export function getTeamValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
