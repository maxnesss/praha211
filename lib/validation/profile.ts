import { z } from "zod";
import { USER_AVATAR_VALUES } from "@/lib/profile-avatars";

const nicknameSchema = z
  .string()
  .trim()
  .max(40, "Přezdívka může mít maximálně 40 znaků.")
  .refine(
    (value) => value.length === 0 || value.length >= 2,
    "Přezdívka musí mít alespoň 2 znaky.",
  );

export const updateNicknameSchema = z.object({
  nickname: nicknameSchema.transform((value) => (value.length > 0 ? value : null)),
});

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

export function getProfileValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Neplatný vstup.";
}
