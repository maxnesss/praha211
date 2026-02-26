import type { CSSProperties } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { DistrictTile } from "@/components/district-tile";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { getUserClaimedDistrictCodes } from "@/lib/game/queries";
import { getChapterBySlug, getDistrictsByChapter } from "@/lib/game/district-catalog";

type ChapterPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const chapter = getChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/chapter/${slug}`)}`);
  }

  const completedCodes = await getUserClaimedDistrictCodes(session.user.id);
  const districts = getDistrictsByChapter(slug);
  const completedCount = districts.filter((district) =>
    completedCodes.has(district.code),
  ).length;

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <Link
            href="/overview"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70 hover:text-cyan-100"
          >
            ← Zpět na přehled
          </Link>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-cyan-50">
            {chapter.name}
          </h1>
          <p className="mt-2 text-sm text-cyan-100/75">
            Postup: <span className={metro.monoDigit}>{completedCount} / {districts.length}</span>
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {districts.map((district, index) => (
              <div
                key={district.code}
                className={metro.staggerItem}
                style={{ "--stagger": index } as CSSProperties}
              >
                <DistrictTile
                  district={district}
                  completed={completedCodes.has(district.code)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
