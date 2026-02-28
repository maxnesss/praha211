import type { CSSProperties } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin-users-table";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 50;

type AdminPageProps = {
  searchParams: Promise<{ page?: string }>;
};

function parsePage(input: string | undefined) {
  const value = Number.parseInt(input ?? "1", 10);
  if (Number.isNaN(value) || value < 1) {
    return 1;
  }
  return value;
}

function toPageHref(page: number) {
  return page <= 1 ? "/admin" : `/admin?page=${page}`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/overview");
  }

  const { page } = await searchParams;
  const requestedPage = parsePage(page);

  const [totalUsers, adminCount, frozenCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isFrozen: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const pageSafe = Math.min(requestedPage, totalPages);
  const skip = (pageSafe - 1) * PAGE_SIZE;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      email: true,
      name: true,
      nickname: true,
      role: true,
      isFrozen: true,
      createdAt: true,
      _count: { select: { claims: true } },
    },
  });

  const rows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    nickname: user.nickname,
    role: user.role,
    isFrozen: user.isFrozen,
    createdAt: user.createdAt.toISOString(),
    claimsCount: user._count.claims,
  }));

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
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[var(--metro-panel)]/80 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.45)] sm:p-8`}>
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
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
          </div>

          <div className="mt-8">
            <AdminUsersTable
              users={rows}
              currentUserId={session.user.id}
              page={pageSafe}
              totalPages={totalPages}
              totalUsers={totalUsers}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {pageSafe > 1 ? (
              <Link
                href={toPageHref(pageSafe - 1)}
                className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                Předchozí
              </Link>
            ) : (
              <span className="rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/45">
                Předchozí
              </span>
            )}

            {pageSafe < totalPages ? (
              <Link
                href={toPageHref(pageSafe + 1)}
                className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                Další
              </Link>
            ) : (
              <span className="rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/45">
                Další
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
