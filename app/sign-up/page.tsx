"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import metro from "@/app/metro-theme.module.css";
import { getFirstZodErrorMessage, registerSchema } from "@/lib/validation/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setIsSubmitting(true);
    await signIn("google", { callbackUrl: "/radnice" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = registerSchema.safeParse({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    });

    if (!parsed.success) {
      setError(getFirstZodErrorMessage(parsed.error));
      setIsSubmitting(false);
      return;
    }

    const { name, email, password } = parsed.data;

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      setError(payload?.message || "Nepodařilo se vytvořit váš účet.");
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/radnice",
      redirect: false,
    });

    if (!signInResult || signInResult.error) {
      router.push("/sign-in");
      return;
    }

    router.push(signInResult.url || "/radnice");
    router.refresh();
  }

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className={`${metro.pageReveal} w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.5)] sm:p-8`}>
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Registrace</h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Vytvořte si účet. Noví uživatelé dostanou roli <code>USER</code>.
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
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
              <p className="text-xs text-cyan-100/65">Minimálně 8 znaků.</p>
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
