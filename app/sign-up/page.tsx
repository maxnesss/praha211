"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import metro from "@/app/metro-theme.module.css";
import { PasswordField } from "@/components/password-field";
import {
  getFirstZodErrorMessage,
  nicknameSchema,
  registerSchema,
} from "@/lib/validation/auth";

const REDIRECT_DELAY_MS = 3500;
const NICKNAME_AVAILABILITY_DEBOUNCE_MS = 320;

type NicknameAvailabilityState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available"; message: string }
  | { kind: "taken"; message: string }
  | { kind: "invalid"; message: string }
  | { kind: "error"; message: string };

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameAvailability, setNicknameAvailability] = useState<NicknameAvailabilityState>({
    kind: "idle",
  });
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const trimmedNickname = nicknameDraft.trim();
    const parsedNickname = nicknameSchema.safeParse(trimmedNickname);
    if (!parsedNickname.success) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/nickname-availability?nickname=${encodeURIComponent(parsedNickname.data)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | {
            available?: boolean;
            message?: string;
          }
          | null;

        if (!response.ok) {
          setNicknameAvailability({
            kind: "error",
            message: payload?.message ?? "Kontrola přezdívky se nepodařila.",
          });
          return;
        }

        if (payload?.available) {
          setNicknameAvailability({
            kind: "available",
            message: payload.message ?? "Přezdívka je volná.",
          });
          return;
        }

        setNicknameAvailability({
          kind: "taken",
          message: payload?.message ?? "Tuto přezdívku už používá jiný hráč.",
        });
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setNicknameAvailability({
          kind: "error",
          message: "Kontrola přezdívky se nepodařila.",
        });
      }
    }, NICKNAME_AVAILABILITY_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [nicknameDraft]);

  function handleNicknameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextNickname = event.target.value;
    setNicknameDraft(nextNickname);

    const trimmedNickname = nextNickname.trim();
    if (trimmedNickname.length === 0) {
      setNicknameAvailability({ kind: "idle" });
      return;
    }

    const parsedNickname = nicknameSchema.safeParse(trimmedNickname);
    if (!parsedNickname.success) {
      setNicknameAvailability({
        kind: "invalid",
        message: getFirstZodErrorMessage(parsedNickname.error),
      });
      return;
    }

    setNicknameAvailability({ kind: "checking" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const parsed = registerSchema.safeParse({
      name: String(formData.get("name") || ""),
      nickname: String(formData.get("nickname") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      registrationCode: String(formData.get("registrationCode") || ""),
      privacyPolicyAccepted: formData.get("privacyPolicyAccepted") === "on",
    });

    if (!parsed.success) {
      setError(getFirstZodErrorMessage(parsed.error));
      setIsSubmitting(false);
      return;
    }

    if (parsed.data.password !== confirmPassword) {
      setError("Hesla se neshodují.");
      setIsSubmitting(false);
      return;
    }

    if (nicknameAvailability.kind === "checking") {
      setError("Počkejte prosím na dokončení kontroly přezdívky.");
      setIsSubmitting(false);
      return;
    }

    if (nicknameAvailability.kind === "taken" || nicknameAvailability.kind === "invalid") {
      setError(nicknameAvailability.message);
      setIsSubmitting(false);
      return;
    }

    const {
      name,
      nickname,
      email,
      password,
      registrationCode,
      privacyPolicyAccepted,
    } = parsed.data;

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        nickname,
        email,
        password,
        registrationCode,
        privacyPolicyAccepted,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setError(payload?.message || "Nepodařilo se vytvořit váš účet.");
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    form.reset();
    setNicknameDraft("");
    setNicknameAvailability({ kind: "idle" });
    setSuccess(
      `${payload?.message
        || "Účet byl vytvořen. Pro dokončení registrace potvrďte odkaz v ověřovacím e-mailu."
      } Za chvíli budete přesměrováni na přihlášení.`,
    );
    setIsSubmitting(false);

    redirectTimeoutRef.current = setTimeout(() => {
      router.push("/sign-in");
      router.refresh();
    }, REDIRECT_DELAY_MS);
  }

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className={`${metro.pageReveal} w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.5)] sm:p-8 ${metro.mobilePanel}`}>
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Registrace</h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Vytvořte si účet. Noví uživatelé dostanou roli <code>USER</code>.
          </p>
          <p className="mt-2 text-xs text-cyan-100/65">
            <span className="text-rose-300" aria-hidden="true">
              *
            </span>{" "}
            povinné pole
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-cyan-100">
                Jméno
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nickname" className="text-sm font-medium text-cyan-100">
                Přezdívka{" "}
                <span className="text-rose-300" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={40}
                value={nicknameDraft}
                onChange={handleNicknameChange}
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
              <p className="text-xs text-cyan-100/65">Přezdívku po registraci nelze změnit.</p>
              {nicknameAvailability.kind === "checking" ? (
                <p className="text-xs text-cyan-100/75">Kontroluji dostupnost přezdívky...</p>
              ) : null}
              {nicknameAvailability.kind === "available" ? (
                <p className="text-xs text-emerald-200">{nicknameAvailability.message}</p>
              ) : null}
              {nicknameAvailability.kind === "taken"
                || nicknameAvailability.kind === "invalid"
                || nicknameAvailability.kind === "error" ? (
                  <p className="text-xs text-rose-200">{nicknameAvailability.message}</p>
                ) : null}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-cyan-100">
                E-mail{" "}
                <span className="text-rose-300" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="registrationCode" className="text-sm font-medium text-cyan-100">
                Registrační kód{" "}
                <span className="text-rose-300" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="registrationCode"
                name="registrationCode"
                type="text"
                autoComplete="off"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-cyan-100">
                Heslo{" "}
                <span className="text-rose-300" aria-hidden="true">
                  *
                </span>
              </label>
              <PasswordField
                id="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
              <p className="text-xs text-cyan-100/65">Minimálně 8 znaků.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-cyan-100">
                Potvrzení hesla{" "}
                <span className="text-rose-300" aria-hidden="true">
                  *
                </span>
              </label>
              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-md border border-cyan-300/20 bg-cyan-500/5 px-3 py-2 text-sm text-cyan-100/85">
              <input
                id="privacyPolicyAccepted"
                name="privacyPolicyAccepted"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-cyan-300/50 bg-[#08161f] text-cyan-300 focus:ring-cyan-300"
              />
              <span>
                <span className="text-rose-300" aria-hidden="true">
                  *
                </span>{" "}
                Souhlasím se zpracováním osobních údajů podle{" "}
                <Link
                  href="/ochrana-osobnich-udaju"
                  className="font-medium text-cyan-50 underline underline-offset-4 hover:text-cyan-100"
                  target="_blank"
                  rel="noreferrer"
                >
                  zásad ochrany osobních údajů (GDPR)
                </Link>
                .
              </span>
            </label>

            {error ? (
              <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={
                isSubmitting
                || nicknameAvailability.kind === "checking"
                || nicknameAvailability.kind === "taken"
                || nicknameAvailability.kind === "invalid"
              }
              className="w-full rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Vytvářím účet..." : "Vytvořit účet"}
            </button>
          </form>

          <p className="mt-5 text-sm text-cyan-100/75">
            Už máte účet?{" "}
            <Link href="/sign-in" className="font-medium text-cyan-50 hover:text-cyan-100">
              Přihlásit se
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
