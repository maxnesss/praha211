import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { calculateCurrentStreak } from "@/lib/game/progress";
import { getUserPointsRanking } from "@/lib/game/queries";
import { prisma } from "@/lib/prisma";

export default async function BodyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fskore");
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
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Skóre
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
            Přehled vašeho skóre
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
            Tady vidíte souhrn bodového výkonu a poslední potvrzené městské části.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Celkem bodů</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{totalPoints}</p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Pořadí</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {ranking.rank && ranking.totalPlayers > 0
                  ? `#${ranking.rank}/${ranking.totalPlayers}`
                  : "Bez pořadí"}
              </p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">
                Odemčené části
              </p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{totalUnlocks}</p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">
                Průměr na odemčení
              </p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{averagePoints}</p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Denní série</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{currentStreak} dní</p>
            </article>
          </div>

          {topClaim ? (
            <article className="mt-6 rounded-xl border border-orange-300/40 bg-orange-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-orange-100/85">Nejsilnější odemčení</p>
              <p className="mt-2 text-lg font-semibold text-orange-100">
                {topClaim.districtName} ({topClaim.districtCode}) · +{topClaim.awardedPoints}
              </p>
            </article>
          ) : null}

          <div className="mt-8 rounded-xl border border-cyan-300/25 bg-[#091925]/75">
            <div className="border-b border-cyan-300/20 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
                Poslední bodované odemčení
              </h2>
            </div>
            <div className="space-y-3 px-4 py-4 sm:hidden">
              {claims.length > 0 ? (
                claims.slice(0, 30).map((claim) => (
                  <article
                    key={claim.id}
                    className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04] p-3 text-cyan-50/90"
                  >
                    <p className={`${metro.monoDigit} text-xs text-cyan-100/70`}>
                      {claim.claimedAt.toLocaleString("cs-CZ")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-cyan-50">
                      {claim.districtName}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="uppercase tracking-[0.1em] text-cyan-200/65">Základ</p>
                        <p className={`${metro.monoDigit} mt-1 text-sm`}>{claim.basePoints}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.1em] text-cyan-200/65">Násobitel</p>
                        <p className={`${metro.monoDigit} mt-1 text-sm`}>
                          {claim.sameDayMultiplier.toFixed(2)}x
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.1em] text-cyan-200/65">Série</p>
                        <p className={`${metro.monoDigit} mt-1 text-sm`}>+{claim.streakBonus}</p>
                      </div>
                    </div>
                    <p className={`${metro.monoDigit} mt-3 text-sm font-semibold text-orange-100`}>
                      +{claim.awardedPoints}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04] px-3 py-4 text-sm text-cyan-100/65">
                  Zatím nemáte žádné bodované odemčení.
                </p>
              )}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="bg-[#06141d]/70 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
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
                      <tr key={claim.id} className="border-t border-cyan-300/20 text-cyan-50/90">
                        <td className={`${metro.monoDigit} whitespace-nowrap px-4 py-2`}>
                          {claim.claimedAt.toLocaleString("cs-CZ")}
                        </td>
                        <td className="px-4 py-2">
                          {claim.districtName}
                        </td>
                        <td className={`${metro.monoDigit} px-4 py-2`}>{claim.basePoints}</td>
                        <td className={`${metro.monoDigit} px-4 py-2`}>{claim.sameDayMultiplier.toFixed(2)}x</td>
                        <td className={`${metro.monoDigit} px-4 py-2`}>+{claim.streakBonus}</td>
                        <td className={`${metro.monoDigit} px-4 py-2 font-semibold text-orange-100`}>
                          +{claim.awardedPoints}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-cyan-100/65" colSpan={6}>
                        Zatím nemáte žádné bodované odemčení.
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
