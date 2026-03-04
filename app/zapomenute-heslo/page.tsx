"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import metro from "@/app/metro-theme.module.css";
import { getFirstZodErrorMessage, passwordResetRequestSchema } from "@/lib/validation/auth";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = passwordResetRequestSchema.safeParse({
      email: String(formData.get("email") || ""),
    });

    if (!parsed.success) {
      setError(getFirstZodErrorMessage(parsed.error));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setError(payload?.message ?? "Odeslání odkazu se nepodařilo.");
        setIsSubmitting(false);
        return;
      }

      setMessage(
        payload?.message
          ?? "Pokud účet existuje, poslali jsme odkaz pro reset hesla na zadaný e-mail.",
      );
      form.reset();
    } catch {
      setError("Odeslání odkazu se nepodařilo.");
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
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Obnova hesla</h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Zadejte e-mail a pošleme vám odkaz pro nastavení nového hesla.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-cyan-100">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
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
              disabled={isSubmitting}
              className="w-full rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Odesílám..." : "Poslat odkaz"}
            </button>
          </form>

          <p className="mt-5 text-sm text-cyan-100/75">
            Vzpomněli jste si?{" "}
            <Link href="/sign-in" className="font-medium text-cyan-50 hover:text-cyan-100">
              Zpět na přihlášení
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
