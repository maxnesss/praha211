import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { calculateCurrentStreak } from "@/lib/game/progress";
import { getUserPointsRanking } from "@/lib/game/queries";
import { getUserScoreTotal } from "@/lib/game/score-ledger";
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

  const [ranking, totalPoints] = await Promise.all([
    getUserPointsRanking(session.user.id),
    getUserScoreTotal(session.user.id),
  ]);
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
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8 ${metro.mobilePanel}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Skóre
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
            Přehled vašeho skóre
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
            Tady vidíte souhrn bodového výkonu a poslední potvrzené městské části.
          </p>

          <div className="mt-8 grid grid-cols-6 gap-2 sm:hidden">
            <article className="col-span-2 rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Celkem bodů</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>{totalPoints}</p>
            </article>
            <article className="col-span-2 rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Pořadí</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>
                {ranking.rank && ranking.totalPlayers > 0
                  ? `#${ranking.rank}/${ranking.totalPlayers}`
                  : "Bez pořadí"}
              </p>
            </article>
            <article className="col-span-2 rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Odemčeno</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>{totalUnlocks}</p>
            </article>
            <article className="col-span-3 rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Průměr</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>{averagePoints}</p>
            </article>
            <article className="col-span-3 rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">Denní série</p>
              <p className={`${metro.monoDigit} mt-1 text-base font-semibold text-cyan-50`}>{currentStreak} dní</p>
            </article>
          </div>

          <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-5">
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

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
              Poslední bodované odemčení
            </h2>

            {claims.length > 0 ? (
              <ul className="mt-3 divide-y divide-cyan-300/20">
                {claims.slice(0, 30).map((claim) => (
                  <li key={claim.id} className="py-2.5 text-cyan-50/90">
                    <div className="sm:hidden">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-medium text-cyan-50">
                          {claim.districtName}
                        </p>
                        <p className={`${metro.monoDigit} shrink-0 text-sm font-semibold text-orange-100`}>
                          +{claim.awardedPoints}
                        </p>
                      </div>
                      <p className={`${metro.monoDigit} mt-0.5 text-[11px] leading-4 text-cyan-100/70`}>
                        {claim.claimedAt.toLocaleString("cs-CZ")} · Základ {claim.basePoints} · Násobitel {claim.sameDayMultiplier.toFixed(2)}x · Série bonus +{claim.streakBonus}
                      </p>
                    </div>

                    <div className="hidden sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_auto_auto_auto_auto] sm:items-center sm:gap-3">
                      <p className={`${metro.monoDigit} text-xs text-cyan-100/70`}>
                        {claim.claimedAt.toLocaleString("cs-CZ")}
                      </p>
                      <p className="text-sm font-medium text-cyan-50">
                        {claim.districtName}
                      </p>
                      <p className={`${metro.monoDigit} text-xs text-cyan-100/75`}>
                        Základ {claim.basePoints}
                      </p>
                      <p className={`${metro.monoDigit} text-xs text-cyan-100/75`}>
                        Násobitel {claim.sameDayMultiplier.toFixed(2)}x
                      </p>
                      <p className={`${metro.monoDigit} text-xs text-cyan-100/75`}>
                        Série bonus +{claim.streakBonus}
                      </p>
                      <p className={`${metro.monoDigit} text-sm font-semibold text-orange-100`}>
                        +{claim.awardedPoints}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-cyan-100/65">
                Zatím nemáte žádné bodované odemčení.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
