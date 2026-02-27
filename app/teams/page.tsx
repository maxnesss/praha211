import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TeamsHub } from "@/components/teams-hub";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeam, getTeamsDirectory } from "@/lib/team-queries";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fteams");
  }

  const [teams, currentTeam] = await Promise.all([
    getTeamsDirectory(),
    getCurrentUserTeam(session.user.id),
  ]);

  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Týmy
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
            Týmová základna
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
            Vyberte si svou posádku, spojte síly a proměňte městské části ve společné vítězství.
          </p>

          <TeamsHub
            teams={teams}
            currentTeamSlug={currentTeam?.slug ?? null}
            currentTeamName={currentTeam?.name ?? null}
          />
        </div>
      </section>
    </main>
  );
}
