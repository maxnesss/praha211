import type { CSSProperties } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/radnice");
  }

  const pendingValidationCountPromise =
    prisma.districtClaimSubmission?.count?.({ where: { status: "PENDING" } }) ??
    Promise.resolve(0);

  const pendingValidationCountPromise =
    prisma.districtClaimSubmission?.count?.({ where: { status: "PENDING" } }) ??
    Promise.resolve(0);

  const [totalUsers, adminCount, frozenCount, pendingValidationCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isFrozen: true } }),
    pendingValidationCountPromise,
  ]);

  const metroVars = {
    "--metro-bg": "#06141d",
    "--metro-panel": "#0c202e",
    "--metro-ink": "#e6fbff",
  } as CSSProperties;

  return (
    <main className={metro.routeShell} style={metroVars}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-60`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[var(--metro-panel)]/80 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.45)] sm:p-8 ${metro.mobilePanel}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Administrace
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
                Správa uživatelů
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
                Přehled všech účtů, rychlé povýšení na ADMIN a možnost zmrazit
                účet při porušení pravidel.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/ucty"
                className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50 transition-colors hover:bg-cyan-400/20"
              >
                Seznam účtů
              </Link>
              <Link
                href="/admin/validace"
                className="rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-orange-50 transition-colors hover:bg-orange-400/30"
              >
                Čekající validace ({pendingValidationCount})
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Uživatelé</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {rows.length}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">ADMIN</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {adminCount}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Zmrazení</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {frozenCount}
              </p>
            </article>
            <article className="rounded-lg border border-orange-300/35 bg-orange-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-100/80">Čekající validace</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-orange-50`}>
                {pendingValidationCount}
              </p>
            </article>
          </div>

        </div>
      </section>
    </main>
  );
}
