import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              Pořadí
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Žebříček hráčů
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Seřazení podle celkových bodů. Při shodě bodů rozhoduje počet odemčených částí.
            </p>
          </div>

          <Link
            href="/overview"
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:bg-slate-900"
          >
            Zpět na přehled
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hráčů v pořadí</p>
            <p className="mt-2 text-2xl font-semibold">{leaderboard.length}</p>
          </article>
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Vaše pozice</p>
            <p className="mt-2 text-2xl font-semibold">
              {myEntry ? `#${myEntry.rank}` : "Bez pořadí"}
            </p>
          </article>
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Vaše body</p>
            <p className="mt-2 text-2xl font-semibold">{myEntry?.points ?? 0}</p>
          </article>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.12em] text-slate-400">
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
                        className={`border-t border-slate-800/80 ${
                          isCurrentUser ? "bg-amber-500/10 text-amber-100" : "text-slate-200"
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold">#{entry.rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{toPublicPlayerName(entry.name, entry.email, index)}</span>
                            {isCurrentUser ? (
                              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                                Vy
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{entry.points}</td>
                        <td className="px-4 py-3">{entry.completed} / 112</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={4}>
                      Zatím nejsou v žebříčku žádní hráči.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
