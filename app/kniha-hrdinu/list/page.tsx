import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { toLeaderboardPlayerLabel } from "@/lib/game/leaderboard-display";
import { getPodiumMedal } from "@/lib/game/leaderboard-podium";
import { getPointsLeaderboardPage } from "@/lib/game/queries";
import { DEFAULT_USER_AVATAR } from "@/lib/profile-avatars";

const PAGE_SIZE = 50;
const SEARCH_QUERY_MAX_LENGTH = 64;

type LeaderboardListPageProps = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

function parsePage(input: string | undefined) {
  const value = Number.parseInt(input ?? "1", 10);
  if (Number.isNaN(value) || value < 1) {
    return 1;
  }
  return value;
}

function parseSearchQuery(input: string | undefined) {
  return input?.trim().slice(0, SEARCH_QUERY_MAX_LENGTH) ?? "";
}

function toPageHref(page: number, searchQuery: string) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  if (searchQuery) {
    params.set("q", searchQuery);
  }

  const query = params.toString();
  return query ? `/kniha-hrdinu/list?${query}` : "/kniha-hrdinu/list";
}

export default async function LeaderboardListPage({
  searchParams,
}: LeaderboardListPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fkniha-hrdinu%2Flist");
  }

  const { page, q } = await searchParams;
  const requestedPage = parsePage(page);
  const searchQuery = parseSearchQuery(q);
  const leaderboard = await getPointsLeaderboardPage(requestedPage, PAGE_SIZE, searchQuery);

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8 ${metro.mobilePanel}`}>
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
                href="/kniha-hrdinu"
                className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/30"
              >
                Zkrácený přehled
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:hidden">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">
                {searchQuery ? "Nalezených hráčů" : "Hráčů v pořadí"}
              </p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>
                {leaderboard.totalPlayers}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Strana</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>
                {leaderboard.page}/{leaderboard.totalPages}
              </p>
            </article>
            <article className="col-span-2 rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Na stránce</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>
                {leaderboard.entries.length}
              </p>
            </article>
          </div>

          <div className="mt-6 hidden gap-3 sm:grid sm:grid-cols-3">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">
                {searchQuery ? "Nalezených hráčů" : "Hráčů v pořadí"}
              </p>
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

          <form action="/kniha-hrdinu/list" method="get" className="mt-6 border-t border-cyan-300/20 pt-5">
            <label htmlFor="leaderboard-search" className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
              Vyhledat hráče
            </label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="leaderboard-search"
                name="q"
                defaultValue={searchQuery}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Přezdívka, jméno nebo e-mail"
                className="w-full rounded-md border border-cyan-300/35 bg-[#081823] px-3 py-2 text-sm text-cyan-50 outline-none transition placeholder:text-cyan-200/45 focus:border-cyan-200/80"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
                >
                  Hledat
                </button>
                {searchQuery ? (
                  <Link
                    href="/kniha-hrdinu/list"
                    className="rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/85 transition-colors hover:bg-cyan-400/10"
                  >
                    Vyčistit
                  </Link>
                ) : null}
              </div>
            </div>
          </form>

          <section className="mt-8">
            <div className="sm:hidden">
              {leaderboard.entries.length > 0 ? (
                <ul className="divide-y divide-cyan-300/20">
                  {leaderboard.entries.map((entry) => {
                    const isCurrentUser = entry.userId === session.user.id;
                    const podiumMedal = getPodiumMedal(entry.rank);

                    return (
                      <li
                        key={entry.userId}
                        className={`py-2.5 ${
                          isCurrentUser
                            ? "bg-orange-400/[0.04] text-orange-100"
                            : "text-cyan-50/90"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden={!podiumMedal}
                            aria-label={podiumMedal?.medalLabel}
                            title={podiumMedal?.medalLabel}
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm leading-none"
                          >
                            {podiumMedal?.medal ?? ""}
                          </span>
                          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-cyan-300/30">
                            <Image
                              src={`/user_icons/${entry.avatar ?? DEFAULT_USER_AVATAR}.webp`}
                              alt={`Avatar hráče ${toLeaderboardPlayerLabel(entry)}`}
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          </span>
                          <Link
                            href={`/player/${entry.userId}`}
                            className="min-w-0 truncate text-sm font-semibold underline decoration-cyan-300/35 underline-offset-2 transition-colors hover:text-white"
                          >
                            {toLeaderboardPlayerLabel(entry)}
                          </Link>
                          {isCurrentUser ? (
                            <span className="rounded bg-orange-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                              Vy
                            </span>
                          ) : null}
                          <p className={`${metro.monoDigit} ml-auto shrink-0 text-sm font-semibold`}>
                            {entry.points}
                          </p>
                        </div>
                        <p className={`${metro.monoDigit} mt-0.5 text-[11px] text-cyan-100/70`}>
                          Pořadí #{entry.rank} · Odemčeno {entry.completed} / 112
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-cyan-100/65">
                  {searchQuery
                    ? "Pro tento dotaz nebyl nalezen žádný hráč."
                    : "Zatím nejsou v žebříčku žádní hráči."}
                </p>
              )}
            </div>

            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
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
                      const podiumMedal = getPodiumMedal(entry.rank);

                      return (
                        <tr
                          key={entry.userId}
                          className={`border-t border-cyan-300/20 ${
                            isCurrentUser
                              ? "border-cyan-300/20 bg-orange-400/10 text-orange-100"
                              : "text-cyan-50/90"
                          }`}
                        >
                          <td className={`${metro.monoDigit} px-4 py-3 font-semibold`}>
                            <span className={podiumMedal?.rankClassName ?? ""}>#{entry.rank}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden={!podiumMedal}
                                aria-label={podiumMedal?.medalLabel}
                                title={podiumMedal?.medalLabel}
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm leading-none"
                              >
                                {podiumMedal?.medal ?? ""}
                              </span>
                              <span className="relative h-7 w-7 overflow-hidden rounded-full border border-cyan-300/30">
                                <Image
                                  src={`/user_icons/${entry.avatar ?? DEFAULT_USER_AVATAR}.webp`}
                                  alt={`Avatar hráče ${toLeaderboardPlayerLabel(entry)}`}
                                  fill
                                  sizes="28px"
                                  className="object-cover"
                                />
                              </span>
                              <Link
                                href={`/player/${entry.userId}`}
                                className="underline decoration-cyan-300/35 underline-offset-2 transition-colors hover:text-white"
                              >
                                {toLeaderboardPlayerLabel(entry)}
                              </Link>
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
                        {searchQuery
                          ? "Pro tento dotaz nebyl nalezen žádný hráč."
                          : "Zatím nejsou v žebříčku žádní hráči."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-4 flex items-center justify-between gap-3">
            {leaderboard.page > 1 ? (
              <Link
                href={toPageHref(leaderboard.page - 1, searchQuery)}
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
                href={toPageHref(leaderboard.page + 1, searchQuery)}
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
