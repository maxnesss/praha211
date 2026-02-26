import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { getPointsLeaderboard } from "@/lib/game/queries";

function toPublicPlayerName(name: string | null, email: string | null, index: number) {
  const normalizedName = name?.trim();
  if (normalizedName) {
    return normalizedName;
  }

  const localPart = email?.split("@")[0]?.trim();
  if (localPart) {
    if (localPart.length <= 2) {
      return `${localPart[0] ?? "U"}*`;
    }
    return `${localPart.slice(0, 2)}***`;
  }

  return `Hráč ${index + 1}`;
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fleaderboard");
  }

  const leaderboard = await getPointsLeaderboard(200);
  const myEntry = leaderboard.find((entry) => entry.userId === session.user.id) ?? null;

  return (
    <main className={`${metro.routeShell} font-[family:var(--font-ui)]`}>
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
                Seřazení podle celkových bodů. Při shodě bodů rozhoduje počet odemčených částí.
              </p>
            </div>

            <Link
              href="/overview"
              className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
            >
              Zpět na přehled
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Hráčů v pořadí</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{leaderboard.length}</p>
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
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => {
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
                              <span>{toPublicPlayerName(entry.name, entry.email, index)}</span>
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
        </div>
      </section>
    </main>
  );
}
