import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { GameInfoFab } from "@/components/game-info-fab";
import { DEFAULT_USER_AVATAR } from "@/lib/profile-avatars";
import { getUserNavStats, type UserNavStats } from "@/lib/game/queries";

type SiteHeaderProps = {
  session: Session | null;
};

type NavStatTileProps = {
  label: string;
  value: string | number;
  href?: string;
  prominent?: boolean;
  className?: string;
};

function NavStatTile({ label, value, href, prominent = false, className }: NavStatTileProps) {
  const containerClass = prominent
    ? "rounded-lg border border-orange-300/60 bg-gradient-to-b from-orange-400/28 to-orange-500/12 px-3 py-2 shadow-[0_10px_22px_rgba(251,146,60,0.18)] transition-colors hover:from-orange-400/36 hover:to-orange-500/20"
    : "rounded-md border border-cyan-300/25 bg-cyan-500/5 px-2 py-1.5 transition-colors hover:border-cyan-200/50 hover:bg-cyan-500/10";

  const content = (
    <>
      <p
        className={
          prominent
            ? "text-[10px] uppercase tracking-[0.16em] text-orange-100/85"
            : "text-[9px] uppercase tracking-[0.12em] text-cyan-200/65"
        }
      >
        {label}
      </p>
      <p className={prominent ? "text-sm font-bold text-orange-50" : "text-xs font-semibold text-cyan-50"}>
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${containerClass} ${className ?? ""}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className={`${containerClass} ${className ?? ""}`}>
      {content}
    </article>
  );
}

export async function SiteHeader({ session }: SiteHeaderProps) {
  const homeHref = session?.user ? "/overview" : "/";
  const headerAvatar = session?.user?.avatar ?? DEFAULT_USER_AVATAR;
  let navStats: UserNavStats | null = null;

  if (session?.user?.id) {
    navStats = await getUserNavStats(session.user.id);
  }

  return (
    <header className="border-b border-cyan-300/25 bg-[#071824]/90 backdrop-blur">
      <nav className="relative mx-auto w-full max-w-7xl px-4 py-3 sm:px-8 sm:py-4">
        {session?.user ? (
          <Link
            href="/profile"
            aria-label="Profil"
            className="absolute right-4 top-3 text-cyan-100 transition-opacity hover:opacity-90 sm:right-8 sm:top-4"
          >
            <span className="relative block h-8 w-8 overflow-hidden rounded-full">
              <Image
                src={`/user_icons/${headerAvatar}.webp`}
                alt="Avatar uživatele"
                fill
                sizes="32px"
                className="object-cover"
              />
            </span>
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
              className="hero-logo-motion h-[30vh] w-[30vh] max-h-[14.5rem] max-w-[14.5rem] min-h-16 min-w-16 object-contain drop-shadow-[0_0_26px_rgba(34,211,238,0.35)] sm:min-h-20 sm:min-w-20"
            />
          </Link>

          <div className="justify-self-end text-sm font-medium text-cyan-100">
            {session?.user ? null : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/sign-in"
                  className="rounded-md border border-cyan-300/35 bg-cyan-500/5 px-3 py-1.5 text-cyan-100 transition-colors hover:bg-cyan-500/15 sm:px-4 sm:py-2"
                >
                  Přihlásit se
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md border border-orange-300/55 bg-orange-400/15 px-3 py-1.5 text-orange-50 transition-colors hover:bg-orange-400/25 sm:px-4 sm:py-2"
                >
                  Registrovat se
                </Link>
              </div>
            )}
          </div>
        </div>

        {session?.user ? (
          <div className="mt-2 flex justify-end">
            <GameInfoFab />
          </div>
        ) : null}

        {session?.user && navStats ? (
          <div className="mt-2 border-t border-cyan-300/20 pt-2">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              <NavStatTile label="Body" value={navStats.points} href="/body" />
              <NavStatTile label="Pokladnice" value={navStats.badgesCount} href="/badges" />
              <NavStatTile
                label="Radnice"
                value={navStats.completion}
                href="/overview"
                prominent
                className="col-span-2 sm:col-span-1"
              />
              <NavStatTile label="Kniha hrdinů" value={navStats.ranking} href="/leaderboard" />
              <NavStatTile
                label="Tým"
                value={navStats.teamName}
                href={navStats.teamSlug ? `/team/${navStats.teamSlug}` : "/teams"}
              />
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
