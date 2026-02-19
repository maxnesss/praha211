"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { getFirstZodErrorMessage, registerSchema } from "@/lib/validation/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      setError(payload?.message || "Could not create your account.");
      setIsSubmitting(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false,
    });

    if (!signInResult || signInResult.error) {
      router.push("/sign-in");
      return;
    }

    router.push(signInResult.url || "/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Sign up
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Create your account. New users get the <code>USER</code> role.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-slate-500"
            />
            <p className="text-xs text-slate-500">Minimum 8 characters.</p>
          </div>

          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-slate-900 hover:text-slate-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
