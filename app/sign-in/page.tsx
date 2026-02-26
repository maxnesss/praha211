"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import metro from "@/app/metro-theme.module.css";
import { getFirstZodErrorMessage, signInSchema } from "@/lib/validation/auth";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setIsSubmitting(true);
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/overview";
    await signIn("google", { callbackUrl });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = signInSchema.safeParse({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    });

    if (!parsed.success) {
      setError(getFirstZodErrorMessage(parsed.error));
      setIsSubmitting(false);
      return;
    }

    const { email, password } = parsed.data;
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") || "/overview";

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Neplatný e-mail nebo heslo.");
      setIsSubmitting(false);
      return;
    }

    router.push(result.url || callbackUrl);
    router.refresh();
  }

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className={`${metro.pageReveal} w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.5)] sm:p-8`}>
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Přihlášení</h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Přistupte ke svému účtu pomocí e-mailu a hesla.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center rounded-md border border-cyan-300/45 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Pokračovat přes Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-cyan-300/25" />
            <span className="text-xs font-medium uppercase tracking-wider text-cyan-200/70">
              Nebo
            </span>
            <div className="h-px flex-1 bg-cyan-300/25" />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-cyan-100">
                E-mail
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
              <label htmlFor="password" className="text-sm font-medium text-cyan-100">
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            {error ? (
              <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Přihlašování..." : "Přihlásit se"}
            </button>
          </form>

          <p className="mt-5 text-sm text-cyan-100/75">
            Jste tu poprvé?{" "}
            <Link href="/sign-up" className="font-medium text-cyan-50 hover:text-cyan-100">
              Vytvořit účet
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
