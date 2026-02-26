import { z } from "zod";

const contactEmailSchema = z
  .string()
  .trim()
  .email("Zadejte platnou e-mailovou adresu.")
  .transform((value) => value.toLowerCase());

export const contactTopicOptions = [
  "nahlasit_bug",
  "napad_na_vylepseni",
  "zmena_znaku",
  "zajem_o_spolupraci",
  "ostatni",
] as const;

export type ContactTopic = (typeof contactTopicOptions)[number];

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Zadejte prosím své jméno.")
    .max(120, "Jméno může mít maximálně 120 znaků."),
  email: contactEmailSchema,
  topic: z
    .string()
    .trim()
    .min(1, "Vyberte prosím předmět.")
    .refine(
      (value): value is ContactTopic => contactTopicOptions.includes(value as ContactTopic),
      "Vyberte platný předmět.",
    ),
  message: z
    .string()
    .trim()
    .min(10, "Zpráva musí mít alespoň 10 znaků.")
    .max(2000, "Zpráva může mít maximálně 2000 znaků."),
});

export function getContactValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
