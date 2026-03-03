"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import metro from "@/app/metro-theme.module.css";
import { PasswordField } from "@/components/password-field";
import {
  getFirstZodErrorMessage,
  passwordResetConfirmSchema,
} from "@/lib/validation/auth";

type ResetContext = {
  email: string;
  token: string;
};

function readResetContext(): ResetContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const email = params.get("email")?.trim() ?? "";
  const token = params.get("token")?.trim() ?? "";
  if (!email || !token) {
    return null;
  }

  return { email, token };
}

export default function ResetPasswordPage() {
  const resetContext = useMemo(() => readResetContext(), []);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!resetContext) {
      setError("Odkaz pro reset hesla je neplatnÃ½ nebo neÃºplnÃ½.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");

    if (password !== passwordConfirm) {
      setError("Hesla se neshodujÃ­.");
      return;
    }

    const parsed = passwordResetConfirmSchema.safeParse({
      email: resetContext.email,
      token: resetContext.token,
      password,
    });

    if (!parsed.success) {
      setError(getFirstZodErrorMessage(parsed.error));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(payload?.message ?? "Obnova hesla se nepodaÅ™ila.");
        setIsSubmitting(false);
        return;
      }

      setMessage(payload?.message ?? "Heslo bylo zmÄ›nÄ›no.");
      form.reset();
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 1500);
    } catch {
      setError("Obnova hesla se nepodaÅ™ila.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className={`${metro.pageReveal} w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.5)] sm:p-8 ${metro.mobilePanel}`}>
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">NovÃ© heslo</h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Zadejte novÃ© heslo. Odkaz je platnÃ½ pouze omezenou dobu.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-cyan-100">
                NovÃ© heslo
              </label>
              <PasswordField
                id="password"
                name="password"
                autoComplete="off"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
              <p className="text-xs text-cyan-200/70">MinimÃ¡lnÄ› 8 znakÅ¯.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passwordConfirm" className="text-sm font-medium text-cyan-100">
                Potvrdit heslo
              </label>
              <PasswordField
                id="passwordConfirm"
                name="passwordConfirm"
                autoComplete="off"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            {error ? (
              <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-md border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !resetContext}
              className="w-full rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "UklÃ¡dÃ¡m..." : "Nastavit heslo"}
            </button>
          </form>

          <p className="mt-5 text-sm text-cyan-100/75">
            Chcete se pÅ™ihlÃ¡sit?{" "}
            <Link href="/sign-in" className="font-medium text-cyan-50 hover:text-cyan-100">
              PÅ™ejÃ­t na pÅ™ihlÃ¡Å¡enÃ­
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
