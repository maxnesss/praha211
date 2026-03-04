"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import metro from "@/app/metro-theme.module.css";
import { PasswordField } from "@/components/password-field";
import { getFirstZodErrorMessage, signInSchema } from "@/lib/validation/auth";

const LOGIN_RATE_LIMIT_ERROR = "TOO_MANY_LOGIN_ATTEMPTS";

function toVerificationMessage(value: string | null) {
  if (value === "success") {
    return "E-mail byl úspěšně ověřen. Teď se můžete přihlásit.";
  }

  if (value === "already") {
    return "E-mail už je ověřený. Stačí se přihlásit.";
  }

  if (value === "invalid") {
    return "Ověřovací odkaz je neplatný nebo expirovaný.";
  }

  if (value === "error") {
    return "Ověření e-mailu se nepodařilo. Zkuste to prosím znovu.";
  }

  return null;
}

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const verificationState = new URLSearchParams(window.location.search).get("verification");
    return toVerificationMessage(verificationState);
  });

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
      new URLSearchParams(window.location.search).get("callbackUrl") || "/radnice";

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (!result || result.error) {
      if (
        result?.status === 429
        || result?.error?.includes(LOGIN_RATE_LIMIT_ERROR)
      ) {
        setError("Příliš mnoho pokusů o přihlášení. Zkuste to prosím za chvíli znovu.");
      } else if (result?.error?.includes("ACCOUNT_FROZEN")) {
        setError("Váš účet je zmrazený. Kontaktujte prosím podporu.");
      } else if (result?.error?.includes("EMAIL_NOT_VERIFIED")) {
        setError("E-mail ještě není ověřený. Otevřete odkaz z ověřovacího e-mailu.");
      } else {
        setError("Neplatný e-mail nebo heslo.");
      }
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
        <div className={`${metro.pageReveal} w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.5)] sm:p-8 ${metro.mobilePanel}`}>
          <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Přihlášení</h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Přistupte ke svému účtu pomocí e-mailu a hesla.
          </p>

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
              <PasswordField
                id="password"
                name="password"
                autoComplete="current-password"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
              <div className="flex justify-end">
                <Link
                  href="/zapomenute-heslo"
                  className="text-xs font-medium text-cyan-50/80 hover:text-cyan-50"
                >
                  Zapomněl jsem heslo
                </Link>
              </div>
            </div>

            {error ? (
              <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {!error && verificationMessage ? (
              <p className="rounded-md border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                {verificationMessage}
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
