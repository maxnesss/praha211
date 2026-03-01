"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { DEFAULT_USER_AVATAR, USER_AVATAR_OPTIONS } from "@/lib/profile-avatars";
import { PasswordField } from "@/components/password-field";
import { SignOutButton } from "@/components/sign-out-button";
import {
  changePasswordSchema,
  getProfileValidationMessage,
  updateAvatarSchema,
  updateNicknameSchema,
} from "@/lib/validation/profile";

type ProfileSettingsFormsProps = {
  name: string | null;
  email: string;
  hasPassword: boolean;
  initialNickname: string | null;
  initialAvatar: string | null;
  role: "ADMIN" | "USER";
  showRole: boolean;
};

export function ProfileSettingsForms({
  name,
  email,
  hasPassword,
  initialNickname,
  initialAvatar,
  role,
  showRole,
}: ProfileSettingsFormsProps) {
  const router = useRouter();
  const { update } = useSession();
  const [nicknameDraft, setNicknameDraft] = useState(initialNickname ?? "");
  const [nicknameValue, setNicknameValue] = useState(initialNickname);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isNicknameSubmitting, setIsNicknameSubmitting] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  const resolvedInitialAvatar = initialAvatar ?? DEFAULT_USER_AVATAR;
  const [avatarValue, setAvatarValue] = useState(resolvedInitialAvatar);
  const [avatarDraft, setAvatarDraft] = useState(resolvedInitialAvatar);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isAvatarSubmitting, setIsAvatarSubmitting] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  async function handleNicknameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNicknameError(null);
    setIsNicknameSubmitting(true);

    const parsed = updateNicknameSchema.safeParse({ nickname: nicknameDraft });
    if (!parsed.success) {
      setNicknameError(getProfileValidationMessage(parsed.error));
      setIsNicknameSubmitting(false);
      return;
    }

    const response = await fetch("/api/profile/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nicknameDraft }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setNicknameError(payload?.message ?? "Přezdívku se nepodařilo uložit.");
      setIsNicknameSubmitting(false);
      return;
    }

    setNicknameValue(parsed.data.nickname);
    setIsNicknameSubmitting(false);
    setIsNicknameModalOpen(false);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = changePasswordSchema.safeParse({
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmNewPassword: String(formData.get("confirmNewPassword") ?? ""),
    });

    if (!parsed.success) {
      setPasswordError(getProfileValidationMessage(parsed.error));
      setIsPasswordSubmitting(false);
      return;
    }

    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setPasswordError(payload?.message ?? "Heslo se nepodařilo změnit.");
      setIsPasswordSubmitting(false);
      return;
    }

    setPasswordSuccess(payload?.message ?? "Heslo bylo úspěšně změněno.");
    setIsPasswordSubmitting(false);
    form.reset();
  }

  async function handleAvatarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAvatarError(null);
    setIsAvatarSubmitting(true);

    const parsed = updateAvatarSchema.safeParse({ avatar: avatarDraft });
    if (!parsed.success) {
      setAvatarError(getProfileValidationMessage(parsed.error));
      setIsAvatarSubmitting(false);
      return;
    }

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setAvatarError(payload?.message ?? "Avatar se nepodařilo uložit.");
      setIsAvatarSubmitting(false);
      return;
    }

    const nextAvatar = parsed.data.avatar;
    setAvatarValue(nextAvatar);
    setIsAvatarSubmitting(false);
    setIsAvatarModalOpen(false);
    await update({ avatar: nextAvatar }).catch(() => null);
    router.refresh();
  }

  return (
    <>
      <article className="mt-8 max-w-2xl rounded-xl border border-cyan-300/25 bg-[#091925]/70 p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-[180px,1fr] sm:items-center">
          <dt className="font-semibold uppercase tracking-[0.14em] text-cyan-200/65">
            Avatar
          </dt>
          <dd className="text-cyan-50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAvatarError(null);
                  setAvatarDraft(avatarValue);
                  setIsAvatarModalOpen(true);
                }}
                className="group relative h-14 w-14 overflow-hidden rounded-full border border-cyan-300/35 bg-[#08161f] transition-colors hover:border-cyan-200/70"
                aria-label="Změnit avatar"
              >
                <Image
                  src={`/user_icons/${avatarValue}.webp`}
                  alt="Aktuální avatar"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarError(null);
                  setAvatarDraft(avatarValue);
                  setIsAvatarModalOpen(true);
                }}
                className="rounded-md border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20"
              >
                Změnit avatar
              </button>
            </div>
          </dd>

          <dt className="font-semibold uppercase tracking-[0.14em] text-cyan-200/65">
            Jméno
          </dt>
          <dd className="text-cyan-50">{name ?? "Neuvedeno"}</dd>

          <dt className="font-semibold uppercase tracking-[0.14em] text-cyan-200/65">
            Přezdívka
          </dt>
          <dd className="text-cyan-50">
            <div className="flex items-center gap-2">
              <span>{nicknameValue ?? "Neuvedeno"}</span>
              <button
                type="button"
                aria-label="Upravit přezdívku"
                onClick={() => {
                  setNicknameError(null);
                  setNicknameDraft(nicknameValue ?? "");
                  setIsNicknameModalOpen(true);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-cyan-300/35 bg-cyan-500/10 text-cyan-100 transition-colors hover:bg-cyan-500/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                </svg>
              </button>
            </div>
          </dd>

          <dt className="font-semibold uppercase tracking-[0.14em] text-cyan-200/65">
            E-mail
          </dt>
          <dd className="text-cyan-50">{email}</dd>

          {showRole ? (
            <>
              <dt className="font-semibold uppercase tracking-[0.14em] text-cyan-200/65">
                Role
              </dt>
              <dd className="text-cyan-50">{role}</dd>
            </>
          ) : null}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setPasswordError(null);
              setPasswordSuccess(null);
              setIsPasswordModalOpen(true);
            }}
            className="rounded-md border border-cyan-300/45 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-500/20"
          >
            {hasPassword ? "Změnit heslo" : "Nastavit heslo"}
          </button>
          <SignOutButton />
        </div>
      </article>

      {isAvatarModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030b11]/80 p-4">
          <div className="mx-auto flex min-h-full w-full items-center justify-center py-4">
            <div className="w-full max-w-3xl rounded-xl border border-cyan-300/35 bg-[#0b1f2f] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-cyan-50">Vyberte avatar</h2>
                  <p className="mt-1 text-sm text-cyan-100/70">
                    Vyberte si avatar, který se bude zobrazovat na vašem profilu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/10"
                >
                  Zavřít
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleAvatarSubmit} autoComplete="off">
                <div className="max-h-[56vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {USER_AVATAR_OPTIONS.map((option) => {
                      const isSelected = avatarDraft === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setAvatarDraft(option.value)}
                          className={`rounded-lg border p-2 text-left transition-colors ${
                            isSelected
                              ? "border-orange-300/70 bg-orange-400/10"
                              : "border-cyan-300/30 bg-[#08161f] hover:border-cyan-200/65"
                          }`}
                        >
                          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full border border-cyan-300/35 bg-[#061119]">
                            <Image
                              src={`/user_icons/${option.value}.webp`}
                              alt={option.label}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-2 text-center text-xs font-medium text-cyan-100">
                            {option.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {avatarError ? (
                  <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {avatarError}
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(false)}
                    className="rounded-md border border-cyan-300/35 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    disabled={isAvatarSubmitting}
                    className="rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isAvatarSubmitting ? "Ukládám..." : "Uložit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {isNicknameModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030b11]/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-cyan-300/35 bg-[#0b1f2f] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-cyan-50">Upravit přezdívku</h2>
                <p className="mt-1 text-sm text-cyan-100/70">
                  Změňte přezdívku, která se zobrazuje v profilu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNicknameModalOpen(false)}
                className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/10"
              >
                Zavřít
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleNicknameSubmit} autoComplete="off">
              <div className="space-y-1.5">
                <label htmlFor="nickname" className="text-sm font-medium text-cyan-100">
                  Přezdívka
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  autoComplete="off"
                  value={nicknameDraft}
                  onChange={(event) => setNicknameDraft(event.target.value)}
                  maxLength={40}
                  className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
                />
              </div>

              {nicknameError ? (
                <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {nicknameError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNicknameModalOpen(false)}
                  className="rounded-md border border-cyan-300/35 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isNicknameSubmitting}
                  className="rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isNicknameSubmitting ? "Ukládám..." : "Uložit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030b11]/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-cyan-300/35 bg-[#0b1f2f] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-cyan-50">
                  {hasPassword ? "Změna hesla" : "Nastavení hesla"}
                </h2>
                <p className="mt-1 text-sm text-cyan-100/70">
                  {hasPassword
                    ? "Zadejte aktuální heslo a nastavte nové."
                    : "Pro účet zatím není nastavené heslo. Nastavte ho zde."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/10"
              >
                Zavřít
              </button>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handlePasswordSubmit} autoComplete="off">
              {hasPassword ? (
                <div className="space-y-1.5">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-cyan-100">
                    Aktuální heslo
                  </label>
                  <PasswordField
                    id="currentPassword"
                    name="currentPassword"
                    autoComplete="off"
                    required={hasPassword}
                    className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-sm font-medium text-cyan-100">
                  Nové heslo
                </label>
                <PasswordField
                  id="newPassword"
                  name="newPassword"
                  autoComplete="off"
                  minLength={8}
                  required
                  className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmNewPassword" className="text-sm font-medium text-cyan-100">
                  Potvrdit nové heslo
                </label>
                <PasswordField
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  autoComplete="off"
                  minLength={8}
                  required
                  className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
                />
              </div>

              {passwordError ? (
                <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {passwordError}
                </p>
              ) : null}

              {passwordSuccess ? (
                <p className="rounded-md border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {passwordSuccess}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-md border border-cyan-300/35 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPasswordSubmitting
                    ? "Ukládám..."
                    : hasPassword
                      ? "Změnit heslo"
                      : "Nastavit heslo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
