import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ClaimDistrictForm } from "@/components/claim-district-form";
import { CoatOfArms } from "@/components/coat-of-arms";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getChapterBySlug, getDistrictByCode } from "@/lib/game/praha112";
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
      awardedPoints: true,
      basePoints: true,
      sameDayMultiplier: true,
      streakBonus: true,
      selfieUrl: true,
    },
  });

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

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Městská část
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {district.name}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Základní hodnota: <strong>{district.basePoints}</strong> bodů
            </p>

            <CoatOfArms
              assetKey={district.coatAssetKey}
              code={district.code}
              name={district.name}
              sizes="(max-width: 1024px) 80vw, 420px"
              className="mt-5 aspect-square w-full max-w-sm"
            />

            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
                Pravidla V1
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Tuto městskou část musíte fyzicky navštívit.</li>
                <li>Na selfie musí být vidět oficiální cedule městské části.</li>
                <li>Pro odeslání je povinná selfie.</li>
                <li>O dokončení rozhoduje serverový čas odeslání.</li>
                <li>Každou městskou část lze potvrdit jen jednou jedním uživatelem.</li>
              </ul>
            </div>
          </article>

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
        </div>
      </section>
    </main>
  );
}
