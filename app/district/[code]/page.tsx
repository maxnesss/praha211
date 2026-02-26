import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ClaimDistrictForm } from "@/components/claim-district-form";
import { DistrictCoatPreview } from "@/components/district-coat-preview";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
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
    <main className={`${metro.routeShell} font-[family:var(--font-ui)]`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em]">
            <Link href="/overview" className="text-cyan-200/70 hover:text-cyan-100">
              Přehled
            </Link>
            <span className="text-cyan-200/45">/</span>
            <Link
              href={`/chapter/${district.chapterSlug}`}
              className="text-cyan-200/70 hover:text-cyan-100"
            >
              {chapter?.name ?? district.chapterName}
            </Link>
            <span className="text-cyan-200/45">/</span>
            <span className="text-orange-200">{district.code}</span>
          </div>

          <div className="mt-6">
            <article className="rounded-2xl border border-cyan-300/30 bg-[#091925]/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
                Městská část
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cyan-50">
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
        </div>
      </section>
    </main>
  );
}
