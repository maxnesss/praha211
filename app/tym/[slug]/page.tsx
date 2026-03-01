import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { TeamLeaderPanel } from "@/components/team-leader-panel";
import { SiteHeader } from "@/components/site-header";
import { TeamMembershipActions } from "@/components/team-membership-actions";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeam, getTeamDetailBySlug } from "@/lib/team-queries";
import { TEAM_MAX_MEMBERS } from "@/lib/team-utils";

type TeamPageContext = {
  params: Promise<{ slug: string }>;
};

export default async function TeamPage({ params }: TeamPageContext) {
  const session = await getServerSession(authOptions);
  const { slug } = await params;

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/tym/${slug}`)}`);
  }

  const [team, currentTeam] = await Promise.all([
    getTeamDetailBySlug(slug, session.user.id),
    getCurrentUserTeam(session.user.id),
  ]);

  if (!team) {
    notFound();
  }

  const isMember = currentTeam?.slug === team.slug;
  const hasOtherTeam = Boolean(currentTeam?.slug && currentTeam.slug !== team.slug);
  const removableMembers = team.members.filter((member) => !member.isLeader);

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
                Tým
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
                {team.name}
              </h1>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-cyan-100/70">
                /tym/{team.slug}
              </p>
              <p className="mt-2 text-sm text-cyan-100/80">
                Velitel: <span className="font-semibold text-cyan-50">{team.leaderDisplayName}</span>
              </p>
            </div>

            <Link
              href="/tym"
              className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
            >
              Zpět na týmy
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Týmové body</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {team.points}
              </p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Odemčeno celkem</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {team.completed}
              </p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Členové</p>
              <p className={`${metro.monoDigit} mt-2 text-2xl font-semibold text-cyan-50`}>
                {team.membersCount}/{TEAM_MAX_MEMBERS}
              </p>
            </article>
            <article className="rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/70">Stav</p>
              <p className="mt-2 text-lg font-semibold text-cyan-50">
                {team.isFull ? "Plný tým" : "Volná místa"}
              </p>
            </article>
          </div>

          <TeamMembershipActions
            teamSlug={team.slug}
            isMember={isMember}
            isLeader={team.isCurrentUserLeader}
            hasOtherTeam={hasOtherTeam}
            currentTeamSlug={currentTeam?.slug ?? null}
            isFull={team.isFull}
            hasPendingRequest={team.hasPendingRequestForCurrentUser}
          />

          {team.isCurrentUserLeader ? (
            <TeamLeaderPanel
              teamSlug={team.slug}
              pendingRequests={team.pendingRequests}
              removableMembers={removableMembers}
            />
          ) : null}

          <div className="mt-8 overflow-hidden rounded-xl border border-cyan-300/25 bg-[#091925]/75">
            <div className="border-b border-cyan-300/20 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
                Členové týmu
              </h2>
            </div>
            <div className="space-y-3 px-4 py-4 sm:hidden">
              {team.members.length > 0 ? (
                team.members.map((member) => (
                  <article
                    key={member.id}
                    className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04] px-3 py-3 text-cyan-50/90"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`${metro.monoDigit} text-sm font-semibold`}>
                        {member.completed} / 112
                      </p>
                      <p className={`${metro.monoDigit} text-sm`}>{member.points}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        href={`/player/${member.id}`}
                        className="text-sm font-semibold underline decoration-cyan-300/35 underline-offset-2 transition-colors hover:text-white"
                      >
                        {member.displayName}
                      </Link>
                      {member.isLeader ? (
                        <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                          Velitel
                        </span>
                      ) : null}
                      {member.isCurrentUser ? (
                        <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                          Vy
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border border-cyan-300/20 bg-cyan-500/[0.04] px-3 py-4 text-sm text-cyan-100/65">
                  Tým zatím nemá žádné členy.
                </p>
              )}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead className="bg-[#06141d]/70 text-xs uppercase tracking-[0.12em] text-cyan-200/60">
                  <tr>
                    <th className="px-4 py-3 text-left">Hráč</th>
                    <th className="px-4 py-3 text-left">Body</th>
                    <th className="px-4 py-3 text-left">Odemčeno</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.length > 0 ? (
                    team.members.map((member) => (
                      <tr key={member.id} className="border-t border-cyan-300/20 text-cyan-50/90">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/player/${member.id}`}
                              className="underline decoration-cyan-300/35 underline-offset-2 transition-colors hover:text-white"
                            >
                              {member.displayName}
                            </Link>
                            {member.isLeader ? (
                              <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                                Velitel
                              </span>
                            ) : null}
                            {member.isCurrentUser ? (
                              <span className="rounded bg-orange-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                                Vy
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className={`${metro.monoDigit} px-4 py-3 font-semibold`}>
                          {member.points}
                        </td>
                        <td className={`${metro.monoDigit} px-4 py-3`}>
                          {member.completed} / 112
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-6 text-cyan-100/65" colSpan={3}>
                        Tým zatím nemá žádné členy.
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
