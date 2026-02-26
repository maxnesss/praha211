import type { CSSProperties } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getUserGameClaims } from "@/lib/game/queries";
import { buildOverview } from "@/lib/game/progress";
import metro from "@/app/metro-theme.module.css";

const integerFormatter = new Intl.NumberFormat("cs-CZ");

function formatInt(value: number) {
  return integerFormatter.format(value);
}

function getProgressTone(progressPercent: number) {
  if (progressPercent >= 100) {
    return "Kapitola dokončena";
  }

  if (progressPercent >= 75) {
    return "Blízko cíle";
  }

  if (progressPercent >= 40) {
    return "Pevný postup";
  }

  if (progressPercent > 0) {
    return "Rozjeto";
  }

  return "Čeká na první claim";
}

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Foverview");
  }

  const claims = await getUserGameClaims(session.user.id);
  const overview = buildOverview(claims);
  const completedChapters = overview.chapterCards.filter(
    (chapter) => chapter.progressPercent === 100,
  ).length;

  const metroVars = {
    "--metro-bg": "#06141d",
    "--metro-panel": "#0c202e",
    "--metro-ink": "#e6fbff",
  } as CSSProperties;

  return (
    <main
      className={`${metro.routeShell} font-[family:var(--font-ui)]`}
      style={metroVars}
    >
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-40`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-60`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[var(--metro-panel)]/80 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.45)] sm:p-8`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Praha 112</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cyan-100 sm:text-5xl">
                Metro dispečink
              </h1>
            </div>
            <p className="rounded-xl border border-orange-300/55 bg-orange-400/10 px-3 py-2 text-xs uppercase tracking-[0.16em] text-orange-100">
              Online přenos postupu
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-cyan-200/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/75">Dokončeno</p>
              <p className={`${metro.monoDigit} mt-2 text-3xl font-semibold`}>
                {String(overview.totalCompleted).padStart(3, "0")}
                <span className="text-base text-cyan-100/70"> / {overview.totalDistricts}</span>
              </p>
            </article>
            <article className="rounded-2xl border border-cyan-200/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/75">Body</p>
              <p className={`${metro.monoDigit} mt-2 text-3xl font-semibold`}>{formatInt(overview.totalPoints)}</p>
            </article>
            <article className="rounded-2xl border border-cyan-200/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/75">Denní série</p>
              <p className={`${metro.monoDigit} mt-2 text-3xl font-semibold`}>{overview.currentStreak}</p>
            </article>
            <article className="rounded-2xl border border-cyan-200/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/75">Kapitoly hotovo</p>
              <p className={`${metro.monoDigit} mt-2 text-3xl font-semibold`}>{completedChapters}</p>
            </article>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {overview.chapterCards.map((chapter, index) => (
              <Link
                key={chapter.slug}
                href={`/chapter/${chapter.slug}`}
                className={`${metro.staggerItem} group rounded-2xl border border-cyan-300/30 bg-[#091925]/70 p-5 transition-all hover:border-cyan-200/80 hover:bg-[#0b1f2f]/85`}
                style={{ "--stagger": index } as CSSProperties}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">
                      Linka {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-cyan-100">
                      {chapter.name}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cyan-200/65">
                      {getProgressTone(chapter.progressPercent)}
                    </p>
                  </div>

                  <div className="grid gap-1 text-right">
                    <span className="text-xl font-semibold text-orange-100">
                      {chapter.progressPercent}%
                    </span>
                    <span className="text-xs text-cyan-100/70">
                      {chapter.completed} / {chapter.total}
                    </span>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-cyan-950/80">
                  <div
                    className={`${metro.meterPulse} h-full rounded-full`}
                    style={{
                      width: `${chapter.progressPercent}%`,
                      background: `repeating-linear-gradient(90deg, ${chapter.accentColor}, ${chapter.accentColor} 8px, rgba(255,255,255,0.82) 8px, rgba(255,255,255,0.82) 11px)`,
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-8 gap-1">
                  {chapter.preview.map((district) => (
                    <div
                      key={district.code}
                      className="h-2 rounded-sm"
                      style={{
                        backgroundColor: district.completed
                          ? chapter.accentColor
                          : "rgba(99,132,149,0.28)",
                      }}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
