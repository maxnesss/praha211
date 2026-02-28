import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { toLeaderboardPlayerLabel } from "@/lib/game/leaderboard-display";
import { getPointsLeaderboardPreview } from "@/lib/game/queries";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fleaderboard");
  }

  const preview = await getPointsLeaderboardPreview(session.user.id, 15);
  const leaderboard = preview.topEntries;
  const myEntry = preview.myEntry;
  const skippedPlayersCount =
    preview.showMyEntrySeparately && myEntry
      ? Math.max(0, myEntry.rank - leaderboard.length - 1)
      : 0;

  return (
    <main className={`${metro.routeShell}`}>
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
                Žebříček hráčů
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
                Tady jsou hrdinové a hrdinky Prahy. Každý bod je další stopa v mapě města.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/leaderboard/list"
                className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/30"
              >
                Kompletní seznam
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
                {preview.totalPlayers}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Vaše pozice</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {myEntry ? `#${myEntry.rank}` : "Bez pořadí"}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Vaše body</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{myEntry?.points ?? 0}</p>
            </article>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-cyan-300/25 bg-[#091925]/75">
            <div className="space-y-3 px-4 py-4 sm:hidden">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry) => {
                  const isCurrentUser = entry.userId === session.user.id;

                  return (
                    <article
                      key={entry.userId}
                      className={`rounded-lg border px-3 py-3 ${
                        isCurrentUser
                          ? "border-orange-300/35 bg-orange-400/10 text-orange-100"
                          : "border-cyan-300/20 bg-cyan-500/[0.04] text-cyan-50/90"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`${metro.monoDigit} text-sm font-semibold`}>#{entry.rank}</p>
                        <p className={`${metro.monoDigit} text-sm`}>{entry.completed} / 112</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          href={`/player/${entry.userId}`}
                          className="text-sm font-semibold transition-colors hover:text-white"
                        >
                          {toLeaderboardPlayerLabel(entry)}
                        </Link>
                        {isCurrentUser ? (
                          <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                            Vy
                          </span>
                        ) : null}
                      </div>
                      <p className={`${metro.monoDigit} mt-2 text-lg font-semibold`}>{entry.points}</p>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04] px-3 py-4 text-sm text-cyan-100/65">
                  Zatím nejsou v žebříčku žádní hráči.
                </p>
              )}

              {preview.showMyEntrySeparately && myEntry ? (
                <>
                  <p className="px-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200/75">
                    {skippedPlayersCount > 0
                      ? `Mezi tím je ještě ${skippedPlayersCount} hráčů`
                      : "Vaše pozice je níže"}
                  </p>
                  <article className="rounded-lg border border-orange-300/35 bg-orange-400/10 px-3 py-3 text-orange-100">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`${metro.monoDigit} text-sm font-semibold`}>#{myEntry.rank}</p>
                      <p className={`${metro.monoDigit} text-sm`}>{myEntry.completed} / 112</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        href={`/player/${myEntry.userId}`}
                        className="text-sm font-semibold transition-colors hover:text-white"
                      >
                        {toLeaderboardPlayerLabel(myEntry)}
                      </Link>
                      <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                        Vy
                      </span>
                    </div>
                    <p className={`${metro.monoDigit} mt-2 text-lg font-semibold`}>{myEntry.points}</p>
                  </article>
                </>
              ) : null}
            </div>
            <div className="hidden overflow-x-auto sm:block">
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
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry) => {
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
                              <Link
                                href={`/player/${entry.userId}`}
                                className="transition-colors hover:text-white"
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
                        Zatím nejsou v žebříčku žádní hráči.
                      </td>
                    </tr>
                  )}
                  {preview.showMyEntrySeparately && myEntry ? (
                    <>
                      <tr className="border-t border-cyan-300/20 bg-cyan-500/[0.03] text-cyan-200/75">
                        <td className="px-4 py-3" colSpan={4}>
                          <div className="flex items-center gap-3">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/30 to-cyan-300/10" />
                            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200/75">
                              {skippedPlayersCount > 0
                                ? `Mezi tím je ještě ${skippedPlayersCount} hráčů`
                                : "Vaše pozice je níže"}
                            </p>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-300/30 to-cyan-300/10" />
                          </div>
                        </td>
                      </tr>
                      <tr className="border-t border-cyan-300/20 bg-orange-400/10 text-orange-100">
                        <td className={`${metro.monoDigit} px-4 py-3 font-semibold`}>
                          #{myEntry.rank}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/player/${myEntry.userId}`}
                              className="transition-colors hover:text-white"
                            >
                              {toLeaderboardPlayerLabel(myEntry)}
                            </Link>
                            <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                              Vy
                            </span>
                          </div>
                        </td>
                        <td className={`${metro.monoDigit} px-4 py-3 font-semibold`}>{myEntry.points}</td>
                        <td className={`${metro.monoDigit} px-4 py-3`}>{myEntry.completed} / 112</td>
                      </tr>
                    </>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
