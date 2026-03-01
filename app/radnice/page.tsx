import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { OverviewDistrictSearch } from "@/components/overview-district-search";
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

type OverviewData = ReturnType<typeof buildOverview>;
type ChapterCardData = OverviewData["chapterCards"][number];

type OverviewStatCardProps = {
  label: string;
  value: ReactNode;
  mono?: boolean;
};

function OverviewStatCard({ label, value, mono = true }: OverviewStatCardProps) {
  return (
    <article className="rounded-2xl border border-cyan-200/25 bg-cyan-500/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/75">{label}</p>
      <p className={`${mono ? `${metro.monoDigit} ` : ""}mt-2 text-3xl font-semibold`}>
        {value}
      </p>
    </article>
  );
}

function OverviewChapterCard({
  chapter,
  index,
}: {
  chapter: ChapterCardData;
  index: number;
}) {
  return (
    <Link
      href={`/chapter/${chapter.slug}`}
      className={`${metro.staggerItem} group rounded-2xl border border-cyan-300/30 bg-[#091925]/70 p-5 transition-all hover:border-cyan-200/80 hover:bg-[#0b1f2f]/85`}
      style={{ "--stagger": index } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-cyan-100">
            {chapter.name}
          </h2>
          <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-cyan-200/65">
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
  );
}

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fradnice");
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
      className={metro.routeShell}
      style={metroVars}
    >
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-40`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-60`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[var(--metro-panel)]/80 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.45)] sm:p-8`}>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <OverviewStatCard
              label="Dokončeno"
              value={(
                <>
                  {overview.totalCompleted}
                  <span className="text-base text-cyan-100/70"> / {overview.totalDistricts}</span>
                </>
              )}
            />
            <OverviewStatCard label="Body" value={formatInt(overview.totalPoints)} />
            <OverviewStatCard label="Denní série" value={overview.currentStreak} />
            <OverviewStatCard label="Kapitoly hotovo" value={completedChapters} />
          </div>

          <OverviewDistrictSearch />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {overview.chapterCards.map((chapter, index) => (
              <OverviewChapterCard
                key={chapter.slug}
                chapter={chapter}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
