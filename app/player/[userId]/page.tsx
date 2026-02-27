import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { toLeaderboardPlayerLabel } from "@/lib/game/leaderboard-display";
import { getPublicPlayerProfile } from "@/lib/game/queries";
import { DEFAULT_USER_AVATAR } from "@/lib/profile-avatars";

type PlayerProfilePageProps = {
  params: Promise<{ userId: string }>;
};

const PRAHA_ACCENTS = [
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

function MiniBadgeChip(props: {
  label: string;
  value: string;
  unlocked: boolean;
  accentColor?: string;
}) {
  const stateClass = props.unlocked
    ? "border-cyan-300/35 bg-cyan-500/10 text-cyan-50"
    : "border-cyan-300/15 bg-[#08161f]/65 text-cyan-100/50";

  return (
    <article
      className={`rounded-md border px-2 py-1.5 text-center ${stateClass}`}
      style={props.unlocked && props.accentColor
        ? {
            borderColor: `${props.accentColor}bb`,
            backgroundColor: `${props.accentColor}1b`,
          }
        : undefined}
    >
      <p className="text-[10px] uppercase tracking-[0.14em]">{props.label}</p>
      <p className={`${metro.monoDigit} mt-0.5 text-xs font-semibold`}>{props.value}</p>
    </article>
  );
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const session = await getServerSession(authOptions);
  const { userId } = await params;

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/player/${userId}`)}`);
  }

  const profile = await getPublicPlayerProfile(userId);

  if (!profile) {
    notFound();
  }

  const displayName = toLeaderboardPlayerLabel(profile);
  const isCurrentUser = profile.userId === session.user.id;

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Hráčský profil
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
                {displayName}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
                Přehled týmového postavení, bodů, postupu a mini odznaků.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentUser ? (
                <Link
                  href="/profile"
                  className="rounded-md border border-orange-300/60 bg-orange-400/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-50 transition-colors hover:bg-orange-400/30"
                >
                  Upravit můj profil
                </Link>
              ) : null}
              <Link
                href="/leaderboard"
                className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                Zpět na žebříček
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-cyan-300/35 bg-[#061119]">
              <Image
                src={`/user_icons/${profile.avatar ?? DEFAULT_USER_AVATAR}.webp`}
                alt={`Avatar hráče ${displayName}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-cyan-50">{displayName}</p>
              <p className="mt-1 truncate text-xs uppercase tracking-[0.12em] text-cyan-100/65">
                {profile.nickname ? `@${profile.nickname}` : "Bez nastavené přezdívky"}
              </p>
              <p className="mt-1 text-sm text-cyan-100/80">
                {profile.teamSlug && profile.teamName ? (
                  <>
                    Tým:{" "}
                    <Link
                      href={`/team/${profile.teamSlug}`}
                      className="font-semibold text-cyan-50 underline decoration-cyan-300/45 underline-offset-2 hover:text-white"
                    >
                      {profile.teamName}
                    </Link>
                  </>
                ) : (
                  "Bez týmu"
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Body</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {profile.points}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Postup</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {profile.completed}/{profile.totalDistricts}
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Splněno</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {profile.completionPercent}%
              </p>
            </article>
            <article className="rounded-lg border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Odznaky</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {profile.badges.totals.unlocked}/{profile.badges.totals.total}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-xl border border-cyan-300/25 bg-[#091925]/75 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
              Mini odznaky
            </h2>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <MiniBadgeChip
                label="Městské části"
                value={`${profile.badges.totals.districtsUnlocked}/112`}
                unlocked={profile.badges.totals.districtsUnlocked === 112}
              />
              <MiniBadgeChip
                label="Kapitoly"
                value={`${profile.badges.totals.chaptersUnlocked}/7`}
                unlocked={profile.badges.totals.chaptersUnlocked === 7}
              />
              <MiniBadgeChip
                label="Praha 1-22"
                value={`${profile.badges.totals.prahaUnlocked}/22`}
                unlocked={profile.badges.totals.prahaUnlocked === 22}
              />
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-100/60">
                Kapitoly
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {profile.badges.chapterBadges.map((badge) => (
                  <MiniBadgeChip
                    key={badge.slug}
                    label={badge.name}
                    value={`${badge.completed}/${badge.total}`}
                    unlocked={badge.unlocked}
                    accentColor={badge.accentColor}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-100/60">
                Praha 1-22
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                {profile.badges.prahaBadges.map((badge) => (
                  <MiniBadgeChip
                    key={`praha-${badge.number}`}
                    label={`Praha ${badge.number}`}
                    value={`${badge.completed}/${badge.total}`}
                    unlocked={badge.unlocked}
                    accentColor={PRAHA_ACCENTS[(badge.number - 1) % PRAHA_ACCENTS.length]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
