"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { DEFAULT_USER_AVATAR, USER_AVATAR_OPTIONS } from "@/lib/profile-avatars";
import { PasswordField } from "@/components/password-field";
import { SignOutButton } from "@/components/sign-out-button";
import {
  DELETE_ACCOUNT_CONFIRMATION_TEXT,
  changePasswordSchema,
  deleteAccountSchema,
  getProfileValidationMessage,
  updateAvatarSchema,
} from "@/lib/validation/profile";

type ProfileSettingsFormsProps = {
  name: string | null;
  email: string;
  hasPassword: boolean;
  initialNickname: string;
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

  const [deleteConfirmationDraft, setDeleteConfirmationDraft] = useState("");
  const [deleteCurrentPasswordDraft, setDeleteCurrentPasswordDraft] = useState("");
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [isDeleteAccountSubmitting, setIsDeleteAccountSubmitting] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

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

  async function handleDeleteAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteAccountError(null);
    setIsDeleteAccountSubmitting(true);

    const parsed = deleteAccountSchema.safeParse({
      currentPassword: deleteCurrentPasswordDraft,
      confirmationText: deleteConfirmationDraft,
    });
    if (!parsed.success) {
      setDeleteAccountError(getProfileValidationMessage(parsed.error));
      setIsDeleteAccountSubmitting(false);
      return;
    }

    if (hasPassword && (parsed.data.currentPassword?.trim().length ?? 0) === 0) {
      setDeleteAccountError("Zadejte aktuální heslo.");
      setIsDeleteAccountSubmitting(false);
      return;
    }

    const response = await fetch("/api/profile/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setDeleteAccountError(payload?.message ?? "Účet se nepodařilo odstranit.");
      setIsDeleteAccountSubmitting(false);
      return;
    }

    await signOut({ callbackUrl: "/" });
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
            <p>{initialNickname}</p>
            <p className="mt-1 text-xs text-cyan-100/70">
              Přezdívku po registraci nelze změnit.
            </p>
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
          <button
            type="button"
            onClick={() => {
              setDeleteAccountError(null);
              setDeleteConfirmationDraft("");
              setDeleteCurrentPasswordDraft("");
              setIsDeleteAccountModalOpen(true);
            }}
            className="rounded-md border border-rose-300/60 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
          >
            Odstranit účet
          </button>
          <SignOutButton />
        </div>
      </article>

      {isDeleteAccountModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030b11]/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-300/40 bg-[#0b1f2f] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-cyan-50">Odstranit účet</h2>
                <p className="mt-1 text-sm text-cyan-100/70">
                  Tato akce je nevratná. Smažou se vaše body, odemčení i historie.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="rounded-md border border-cyan-300/35 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 hover:bg-cyan-400/10"
              >
                Zavřít
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              Pro potvrzení napište přesně:{" "}
              <span className="font-semibold tracking-wide text-rose-50">
                {DELETE_ACCOUNT_CONFIRMATION_TEXT}
              </span>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={handleDeleteAccountSubmit}
              autoComplete="off"
            >
              {hasPassword ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="deleteAccountCurrentPassword"
                    className="text-sm font-medium text-cyan-100"
                  >
                    Aktuální heslo
                  </label>
                  <PasswordField
                    id="deleteAccountCurrentPassword"
                    name="deleteAccountCurrentPassword"
                    value={deleteCurrentPasswordDraft}
                    onChange={(event) => setDeleteCurrentPasswordDraft(event.target.value)}
                    autoComplete="off"
                    required={hasPassword}
                    className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label
                  htmlFor="deleteAccountConfirmation"
                  className="text-sm font-medium text-cyan-100"
                >
                  Potvrzovací text
                </label>
                <input
                  id="deleteAccountConfirmation"
                  name="deleteAccountConfirmation"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmationDraft}
                  onChange={(event) => setDeleteConfirmationDraft(event.target.value)}
                  className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
                />
              </div>

              {deleteAccountError ? (
                <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {deleteAccountError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeleteAccountModalOpen(false)}
                  className="rounded-md border border-cyan-300/35 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isDeleteAccountSubmitting}
                  className="rounded-md border border-rose-300/60 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-50 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeleteAccountSubmitting ? "Odstraňuji..." : "Trvale odstranit účet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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
