import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { buildBadgeOverview } from "@/lib/game/badges";
import { buildOverview } from "@/lib/game/progress";
import { getUserGameClaims, getUserPointsRanking } from "@/lib/game/queries";

type SiteHeaderProps = {
  session: Session | null;
};

type NavStatTileProps = {
  label: string;
  value: string | number;
  href?: string;
};

function NavStatTile({ label, value, href }: NavStatTileProps) {
  const content = (
    <>
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-100">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5 transition-colors hover:border-slate-700 hover:bg-slate-900"
      >
        {content}
      </Link>
    );
  }

  return <article className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1.5">{content}</article>;
}

export async function SiteHeader({ session }: SiteHeaderProps) {
  const homeHref = session?.user ? "/overview" : "/";
  let navStats:
    | {
        points: number;
        completion: string;
        ranking: string;
        dayStreak: string;
        badgesCount: number;
      }
    | null = null;

  if (session?.user?.id) {
    const claims = await getUserGameClaims(session.user.id);
    const overview = buildOverview(claims);
    const ranking = await getUserPointsRanking(session.user.id);
    const badges = buildBadgeOverview(overview.completedCodes);

    navStats = {
      points: ranking.userPoints || overview.totalPoints,
      completion: `${overview.totalCompleted}/${overview.totalDistricts}`,
      ranking:
        ranking.rank && ranking.totalPlayers > 0
          ? `#${ranking.rank}/${ranking.totalPlayers}`
          : "Bez pořadí",
      dayStreak: `${overview.currentStreak} dní`,
      badgesCount: badges.totals.unlocked,
    };
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/90">
      <nav className="relative mx-auto w-full max-w-7xl px-4 py-3 sm:px-8 sm:py-4">
        {session?.user ? (
          <Link
            href="/profile"
            aria-label="Profil"
            className="absolute right-4 top-3 rounded-md border border-slate-700 p-2 text-slate-200 transition-colors hover:bg-slate-800 sm:right-8 sm:top-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.6-3.4 4.3-5 8-5s6.4 1.6 8 5" />
            </svg>
          </Link>
        ) : null}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="h-8 w-8 justify-self-start" aria-hidden />

          <Link
            href={homeHref}
            className="transition-opacity hover:opacity-90"
            aria-label="Přejít na hlavní stránku"
          >
            <Image
              src="/logo/praha-tr.png"
              alt="PRAHA 112 logo"
              width={160}
              height={160}
              className="hero-logo-motion h-[30vh] w-[30vh] max-h-[14.5rem] max-w-[14.5rem] min-h-16 min-w-16 object-contain sm:min-h-20 sm:min-w-20"
            />
          </Link>

          <div className="justify-self-end text-sm font-medium text-slate-300">
            {session?.user ? null : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/sign-in"
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-900 sm:px-4 sm:py-2"
                >
                  Přihlásit se
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-amber-500 px-3 py-1.5 text-slate-950 transition-colors hover:bg-amber-400 sm:px-4 sm:py-2"
                >
                  Registrovat se
                </Link>
              </div>
            )}
          </div>
        </div>

        {session?.user && navStats ? (
          <div className="mt-2 border-t border-slate-800/80 pt-2">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
              <NavStatTile label="Body" value={navStats.points} href="/body" />
              <NavStatTile label="Dokončení" value={navStats.completion} href="/overview" />
              <NavStatTile label="Odznaky" value={navStats.badgesCount} href="/badges" />
              <NavStatTile label="Pořadí" value={navStats.ranking} href="/leaderboard" />
              <NavStatTile label="Denní série" value={navStats.dayStreak} />
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
