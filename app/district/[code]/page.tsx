import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ClaimDistrictForm } from "@/components/claim-district-form";
import { DistrictCoatPreview } from "@/components/district-coat-preview";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getDistrictStory } from "@/lib/game/district-stories";
import { getChapterBySlug, getDistrictByCode } from "@/lib/game/district-catalog";
import { prisma } from "@/lib/prisma";

type DistrictPageProps = {
  params: Promise<{ code: string }>;
};

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { code } = await params;
  const district = getDistrictByCode(code);

  if (!district) {
    notFound();
  }

  const chapter = getChapterBySlug(district.chapterSlug);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  if (!userId) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/district/${district.code}`)}`);
  }

  const existingClaim = await prisma.districtClaim.findUnique({
    where: {
      userId_districtCode: {
        userId,
        districtCode: district.code,
      },
    },
    select: {
      claimedAt: true,
      selfieUrl: true,
    },
  });
  const story = getDistrictStory(district.code);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em]">
          <Link href="/overview" className="text-slate-400 hover:text-slate-200">
            Přehled
          </Link>
          <span className="text-slate-600">/</span>
          <Link
            href={`/chapter/${district.chapterSlug}`}
            className="text-slate-400 hover:text-slate-200"
          >
            {chapter?.name ?? district.chapterName}
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-amber-300">{district.code}</span>
        </div>

        <div className="mt-6">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Městská část
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {district.name}
            </h1>

            <DistrictCoatPreview
              assetKey={district.coatAssetKey}
              code={district.code}
              name={district.name}
              history={story?.history ?? "Historické shrnutí se připravuje."}
              funFact={story?.funFact ?? "Zajímavost doplníme po dalším redakčním průzkumu."}
              sourceUrl={story?.sourceUrl}
              initiallyUnlocked={Boolean(existingClaim)}
              canToggleLock={isAdmin}
            />
            <ClaimDistrictForm
              districtCode={district.code}
              districtName={district.name}
              isAuthenticated={Boolean(userId)}
              isClaimed={Boolean(existingClaim)}
              existingClaim={
                existingClaim
                  ? {
                      ...existingClaim,
                      claimedAt: existingClaim.claimedAt.toISOString(),
                    }
                  : undefined
              }
            />
          </article>
        </div>
      </section>
    </main>
  );
}
