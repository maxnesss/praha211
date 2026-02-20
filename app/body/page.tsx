import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { calculateCurrentStreak } from "@/lib/game/progress";
import { getUserPointsRanking } from "@/lib/game/queries";
import { prisma } from "@/lib/prisma";

export default async function BodyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fbody");
  }

  const claims = await prisma.districtClaim.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      districtCode: true,
      districtName: true,
      awardedPoints: true,
      basePoints: true,
      sameDayMultiplier: true,
      streakBonus: true,
      claimedAt: true,
    },
    orderBy: { claimedAt: "desc" },
  });

  const ranking = await getUserPointsRanking(session.user.id);
  const totalPoints = claims.reduce((sum, claim) => sum + claim.awardedPoints, 0);
  const totalUnlocks = claims.length;
  const averagePoints = totalUnlocks > 0 ? Math.round(totalPoints / totalUnlocks) : 0;
  const currentStreak = calculateCurrentStreak(claims.map((claim) => claim.claimedAt));
  const topClaim = claims.reduce<typeof claims[number] | null>((best, claim) => {
    if (!best || claim.awardedPoints > best.awardedPoints) {
      return claim;
    }
    return best;
  }, null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Body
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Přehled vašich bodů
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Tady vidíte souhrn bodového výkonu a poslední potvrzené městské části.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Celkem bodů</p>
            <p className="mt-2 text-2xl font-semibold">{totalPoints}</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Pořadí</p>
            <p className="mt-2 text-2xl font-semibold">
              {ranking.rank && ranking.totalPlayers > 0
                ? `#${ranking.rank}/${ranking.totalPlayers}`
                : "Bez pořadí"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Odemčené části
            </p>
            <p className="mt-2 text-2xl font-semibold">{totalUnlocks}</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Průměr na odemčení
            </p>
            <p className="mt-2 text-2xl font-semibold">{averagePoints}</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Denní série</p>
            <p className="mt-2 text-2xl font-semibold">{currentStreak} dní</p>
          </article>
        </div>

        {topClaim ? (
          <article className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200">Nejsilnější odemčení</p>
            <p className="mt-2 text-lg font-semibold text-amber-100">
              {topClaim.districtName} ({topClaim.districtCode}) · +{topClaim.awardedPoints}
            </p>
          </article>
        ) : null}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
              Poslední bodované odemčení
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Datum</th>
                  <th className="px-4 py-2 text-left">Městská část</th>
                  <th className="px-4 py-2 text-left">Základ</th>
                  <th className="px-4 py-2 text-left">Násobitel</th>
                  <th className="px-4 py-2 text-left">Série bonus</th>
                  <th className="px-4 py-2 text-left">Získáno</th>
                </tr>
              </thead>
              <tbody>
                {claims.length > 0 ? (
                  claims.slice(0, 30).map((claim) => (
                    <tr key={claim.id} className="border-t border-slate-800/80 text-slate-200">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {claim.claimedAt.toLocaleString("cs-CZ")}
                      </td>
                      <td className="px-4 py-2">
                        {claim.districtName} ({claim.districtCode})
                      </td>
                      <td className="px-4 py-2">{claim.basePoints}</td>
                      <td className="px-4 py-2">{claim.sameDayMultiplier.toFixed(2)}x</td>
                      <td className="px-4 py-2">+{claim.streakBonus}</td>
                      <td className="px-4 py-2 font-semibold text-amber-200">
                        +{claim.awardedPoints}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={6}>
                      Zatím nemáte žádné bodované odemčení.
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
