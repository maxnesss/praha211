import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DistrictBadgeWall } from "@/components/badges/district-badge-wall";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { buildBadgeOverview } from "@/lib/game/badges";
import { getUserClaimedDistrictCodes } from "@/lib/game/queries";

type BadgeChipProps = {
  title: string;
  subtitle: string;
  unlocked: boolean;
  accentColor?: string;
  href?: string;
};

function BadgeChip({
  title,
  subtitle,
  unlocked,
  accentColor,
  href,
}: BadgeChipProps) {
  const baseClassName =
    "group flex h-[4.4rem] w-full min-w-0 flex-col justify-between rounded-md border px-2.5 py-2 text-left transition-transform hover:-translate-y-0.5";

  const stateClassName = unlocked
    ? "border-cyan-300/35 bg-cyan-500/8 text-cyan-50"
    : "border-cyan-300/15 bg-[#08161f]/55 text-cyan-100/45 grayscale opacity-80";

  const style = unlocked
    ? {
        borderColor: accentColor ? `${accentColor}bb` : undefined,
        backgroundColor: accentColor ? `${accentColor}1b` : undefined,
        boxShadow: accentColor ? `0 0 14px ${accentColor}2d` : undefined,
      }
    : undefined;

  const content = (
    <>
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em]">{subtitle}</p>
      <p className="overflow-hidden text-[11px] font-semibold leading-4 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
        {title}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClassName} ${stateClassName}`} style={style} title={`${subtitle} · ${title}`}>
        {content}
      </Link>
    );
  }

  return (
    <article className={`${baseClassName} ${stateClassName}`} style={style} title={`${subtitle} · ${title}`}>
      {content}
    </article>
  );
}

export default async function BadgesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fpokladnice");
  }

  const claimedCodes = await getUserClaimedDistrictCodes(session.user.id);
  const badges = buildBadgeOverview(claimedCodes);
  const prahaAccents = [
    "#f59e0b",
    "#f97316",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
    "#6366f1",
    "#3b82f6",
    "#06b6d4",
    "#14b8a6",
    "#10b981",
    "#84cc16",
    "#eab308",
  ];

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Odznaky
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
                Stěna všech odznaků
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
                Každý odznak je zpočátku duch (šedý). Po odemknutí se rozsvítí do barvy.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Odemčeno celkem</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-orange-100`}>{badges.totals.unlocked}</p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Městské části</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{badges.totals.districtsUnlocked} / 112</p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Kapitoly</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{badges.totals.chaptersUnlocked} / 7</p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Praha 1–22</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>{badges.totals.prahaUnlocked} / 22</p>
            </article>
          </div>

          <div className="mt-8 rounded-xl border border-cyan-300/25 bg-[#091925]/70 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
              Městské části (112)
            </h2>
            <DistrictBadgeWall badges={badges.districtBadges} />
          </div>

          <div className="mt-5 rounded-xl border border-cyan-300/25 bg-[#091925]/70 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
              Kapitoly (7)
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {badges.chapterBadges.map((badge) => (
                <BadgeChip
                  key={badge.slug}
                  title={`${badge.completed}/${badge.total}`}
                  subtitle={badge.name}
                  unlocked={badge.unlocked}
                  accentColor={badge.accentColor}
                  href={`/chapter/${badge.slug}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-300/25 bg-[#091925]/70 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
              Dokončení Praha 1–22
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-11">
              {badges.prahaBadges.map((badge) => {
                const accent = prahaAccents[(badge.number - 1) % prahaAccents.length];

                return (
                  <BadgeChip
                    key={`praha-${badge.number}`}
                    title={`${badge.completed}/${badge.total}`}
                    subtitle={`Praha ${badge.number}`}
                    unlocked={badge.unlocked}
                    accentColor={accent}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
