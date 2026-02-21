import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ChapterCard } from "@/components/chapter-card";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getUserGameClaims } from "@/lib/game/queries";
import { buildOverview } from "@/lib/game/progress";

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Foverview");
  }

  const claims = await getUserGameClaims(session.user.id);
  const overview = buildOverview(claims);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 hidden opacity-10 sm:block"
        style={{
          backgroundImage: "url('/logo/praha-tr.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 520px",
          backgroundSize: "min(80vw, 720px)",
          mixBlendMode: "screen",
        }}
      />
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Praha 112
        </p>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Kapitoly
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {overview.chapterCards.map((chapter) => (
              <ChapterCard key={chapter.slug} {...chapter} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
