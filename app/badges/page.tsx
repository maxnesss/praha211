import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DistrictBadgeWall } from "@/components/badges/district-badge-wall";
import { SiteHeader } from "@/components/site-header";
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
    ? "border-slate-600 text-slate-100"
    : "border-slate-800 bg-slate-900/50 text-slate-500 grayscale opacity-80";

  const style = unlocked
    ? {
        borderColor: accentColor ? `${accentColor}cc` : undefined,
        backgroundColor: accentColor ? `${accentColor}20` : undefined,
        boxShadow: accentColor ? `0 0 14px ${accentColor}30` : undefined,
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
    redirect("/sign-in?callbackUrl=%2Fbadges");
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              Odznaky
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Stěna všech odznaků
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              Každý odznak je zpočátku duch (šedý). Po odemknutí se rozsvítí do barvy.
            </p>
          </div>

          <Link
            href="/overview"
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:bg-slate-900"
          >
            Zpět na přehled
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Odemčeno celkem</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{badges.totals.unlocked}</p>
          </article>
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Městské části</p>
            <p className="mt-2 text-2xl font-semibold">{badges.totals.districtsUnlocked} / 112</p>
          </article>
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Kapitoly</p>
            <p className="mt-2 text-2xl font-semibold">{badges.totals.chaptersUnlocked} / 7</p>
          </article>
          <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Praha 1–22</p>
            <p className="mt-2 text-2xl font-semibold">{badges.totals.prahaUnlocked} / 22</p>
          </article>
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Městské části (112)
          </h2>
          <DistrictBadgeWall badges={badges.districtBadges} />
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
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

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/55 p-4 sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
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
      </section>
    </main>
  );
}
