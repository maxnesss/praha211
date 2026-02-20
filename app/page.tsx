import { getServerSession } from "next-auth";
import { ChapterCard } from "@/components/chapter-card";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { buildOverview } from "@/lib/game/progress";
import { getUserGameClaims } from "@/lib/game/queries";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const claims = session?.user?.id ? await getUserGameClaims(session.user.id) : [];
  const overview = buildOverview(claims);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Praha 112
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Kompletační stěna všech 112 katastrálních území Prahy.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Dokončení je konečné a trvalé. Skóre je nekonečné a výkonové.
          Pravidla V1 jsou založená na důvěře a používají serverový čas každého
          odeslání.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Dokončení
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {overview.totalCompleted} / {overview.totalDistricts}
            </p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Postup
            </p>
            <p className="mt-2 text-2xl font-semibold">{overview.completionPercent}%</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Aktuální série
            </p>
            <p className="mt-2 text-2xl font-semibold">{overview.currentStreak} dní</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Celkové body
            </p>
            <p className="mt-2 text-2xl font-semibold">{overview.totalPoints}</p>
          </article>
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Kapitoly
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overview.chapterCards.map((chapter) => (
              <ChapterCard key={chapter.slug} {...chapter} />
            ))}
          </div>
        </div>

        {!session?.user && (
          <p className="mt-8 rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Přihlaste se a začněte potvrzovat městské části. Všechny kapitoly
            jsou viditelné od začátku, bez umělého zamykání.
          </p>
        )}
      </section>
    </main>
  );
}
