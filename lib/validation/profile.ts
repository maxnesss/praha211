import { z } from "zod";
import { USER_AVATAR_VALUES } from "@/lib/profile-avatars";

export const updateAvatarSchema = z.object({
  avatar: z.enum(USER_AVATAR_VALUES),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Nové heslo musí mít alespoň 8 znaků."),
    confirmNewPassword: z.string().min(1, "Potvrďte nové heslo."),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Nová hesla se neshodují.",
  });

export const DELETE_ACCOUNT_CONFIRMATION_TEXT = "SMAZAT UCET";

export const deleteAccountSchema = z.object({
  confirmationText: z
    .string()
    .trim()
    .refine(
      (value) => value === DELETE_ACCOUNT_CONFIRMATION_TEXT,
      `Pro potvrzení napište přesně "${DELETE_ACCOUNT_CONFIRMATION_TEXT}".`,
    ),
});

export function getProfileValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
