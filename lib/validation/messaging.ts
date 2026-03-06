import { z } from "zod";

export const messageSendModeValues = ["DIRECT", "TEAM", "ALL_USERS"] as const;

export type MessageSendMode = (typeof messageSendModeValues)[number];

export const sendMessageSchema = z.object({
  mode: z.enum(messageSendModeValues),
  recipientUserId: z
    .string()
    .trim()
    .max(191, "Identifikátor příjemce je neplatný.")
    .optional(),
  recipientNickname: z
    .string()
    .trim()
    .max(40, "Přezdívka příjemce je neplatná.")
    .optional(),
  title: z
    .string()
    .trim()
    .min(2, "Předmět zprávy musí mít alespoň 2 znaky.")
    .max(120, "Předmět zprávy může mít maximálně 120 znaků."),
  body: z
    .string()
    .trim()
    .min(2, "Text zprávy musí mít alespoň 2 znaky.")
    .max(2000, "Text zprávy může mít maximálně 2000 znaků."),
}).superRefine((value, context) => {
  if (value.mode !== "DIRECT") {
    return;
  }

  const recipientUserId = value.recipientUserId?.trim() ?? "";
  if (recipientUserId.length > 0) {
    return;
  }

  const recipientNickname = value.recipientNickname?.trim() ?? "";
  if (recipientNickname.length > 0) {
    return;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["recipientUserId"],
    message: "Vyberte příjemce zprávy.",
  });
});

export function getMessagingValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
