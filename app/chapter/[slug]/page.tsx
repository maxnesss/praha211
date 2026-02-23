import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { DistrictTile } from "@/components/district-tile";
import { SiteHeader } from "@/components/site-header";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <Link
          href="/overview"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-200"
        >
          ← Zpět na přehled
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{chapter.name}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Postup: {completedCount} / {districts.length}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {districts.map((district) => (
            <DistrictTile
              key={district.code}
              district={district}
              completed={completedCodes.has(district.code)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
