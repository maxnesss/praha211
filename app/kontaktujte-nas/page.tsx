"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import metro from "@/app/metro-theme.module.css";
import {
  contactFormSchema,
  getContactValidationMessage,
} from "@/lib/validation/contact";

const topicLabelMap = {
  nahlasit_bug: "Nahlásit bug",
  napad_na_vylepseni: "Nápad na vylepšení",
  zmena_znaku: "Změna znaku",
  zajem_o_spolupraci: "Zájem o spolupráci",
  ostatni: "Ostatní",
} as const;

export default function ContactPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = contactFormSchema.safeParse({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      topic: String(formData.get("topic") || ""),
      message: String(formData.get("message") || ""),
    });

    if (!parsed.success) {
      setError(getContactValidationMessage(parsed.error));
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    if (!response.ok) {
      setError(payload?.message || "Nepodařilo se odeslat zprávu.");
      setIsSubmitting(false);
      return;
    }

    setSuccess(payload?.message || "Děkujeme, zpráva byla přijata.");
    form.reset();
    setIsSubmitting(false);
  }

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-50`} />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-10 sm:px-10">
        <div className={`${metro.pageReveal} grid w-full gap-8 rounded-3xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_24px_56px_rgba(0,0,0,0.48)] sm:p-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-10 lg:p-10`}>
          <div className="flex items-center justify-center">
            <Link
              href="/"
              aria-label="Zpět na hlavní stránku"
              className="group block w-fit rounded-xl transition-opacity hover:opacity-90"
            >
              <Image
                src="/logo/praha-tr.png"
                alt="PRAHA 112 logo"
                width={420}
                height={420}
                className="h-44 w-44 object-contain drop-shadow-[0_0_38px_rgba(34,211,238,0.35)] transition-transform duration-200 group-hover:scale-[1.02] sm:h-56 sm:w-56 lg:h-72 lg:w-72"
              />
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
              Kontaktujte nás
            </h1>
            <p className="mt-3 text-sm text-cyan-100/75 sm:text-base">
              Máš otázku nebo tip, jak PRAHA 112 posunout dál? Ozvi se nám.
            </p>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-cyan-100">
                Jméno
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="off"
                required
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
                autoComplete="off"
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="topic" className="text-sm font-medium text-cyan-100">
                Předmět
              </label>
              <select
                id="topic"
                name="topic"
                autoComplete="off"
                required
                defaultValue=""
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              >
                <option value="" disabled>
                  Vyberte předmět
                </option>
                {Object.entries(topicLabelMap).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium text-cyan-100">
                Zpráva
              </label>
              <textarea
                id="message"
                name="message"
                autoComplete="off"
                rows={6}
                required
                className="w-full rounded-md border border-cyan-300/35 bg-[#08161f] px-3 py-2 text-sm text-cyan-50 outline-none transition-colors focus:border-cyan-200"
              />
            </div>

            {error ? (
              <p className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Odesílám..." : "Odeslat zprávu"}
            </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
