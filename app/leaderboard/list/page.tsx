import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { toLeaderboardPlayerLabel } from "@/lib/game/leaderboard-display";
import { getPointsLeaderboardPage } from "@/lib/game/queries";

const PAGE_SIZE = 50;

type LeaderboardListPageProps = {
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
  return page <= 1 ? "/leaderboard/list" : `/leaderboard/list?page=${page}`;
}

export default async function LeaderboardListPage({
  searchParams,
}: LeaderboardListPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fleaderboard%2Flist");
  }

  const { page } = await searchParams;
  const requestedPage = parsePage(page);
  const leaderboard = await getPointsLeaderboardPage(requestedPage, PAGE_SIZE);

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Pořadí
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
                Kompletní žebříček
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
                Všichni hráči přehledně po stránkách.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/leaderboard"
                className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/30"
              >
                Zkrácený přehled
              </Link>
              <Link
                href="/overview"
                className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                Zpět na přehled
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Hráčů v pořadí</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {leaderboard.totalPlayers}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Strana</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {leaderboard.page}/{leaderboard.totalPages}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Na stránce</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {leaderboard.entries.length}
              </p>
            </article>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-cyan-300/25 bg-[#091925]/75">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-[#06141d]/70 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Hráč</th>
                    <th className="px-4 py-3 text-left">Body</th>
                    <th className="px-4 py-3 text-left">Odemčeno</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.length > 0 ? (
                    leaderboard.entries.map((entry) => {
                      const isCurrentUser = entry.userId === session.user.id;

                      return (
                        <tr
                          key={entry.userId}
                          className={`border-t border-cyan-300/20 ${
                            isCurrentUser
                              ? "bg-orange-400/10 text-orange-100"
                              : "text-cyan-50/90"
                          }`}
                        >
                          <td className={`${metro.monoDigit} px-4 py-3 font-semibold`}>#{entry.rank}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{toLeaderboardPlayerLabel(entry)}</span>
                              {isCurrentUser ? (
                                <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                                  Vy
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className={`${metro.monoDigit} px-4 py-3 font-semibold`}>{entry.points}</td>
                          <td className={`${metro.monoDigit} px-4 py-3`}>{entry.completed} / 112</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-cyan-100/65" colSpan={4}>
                        Zatím nejsou v žebříčku žádní hráči.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {leaderboard.page > 1 ? (
              <Link
                href={toPageHref(leaderboard.page - 1)}
                className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                Předchozí
              </Link>
            ) : (
              <span className="rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/45">
                Předchozí
              </span>
            )}

            {leaderboard.page < leaderboard.totalPages ? (
              <Link
                href={toPageHref(leaderboard.page + 1)}
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
