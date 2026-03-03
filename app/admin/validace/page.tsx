import type { CSSProperties } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  AdminPendingValidationsTable,
  type AdminPendingValidationRow,
} from "@/components/admin-pending-validations-table";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toReasonList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 6);
}

export default async function AdminClaimValidationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fadmin%2Fvalidace");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/radnice");
  }

  const pending = await prisma.districtClaimSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      districtCode: true,
      districtName: true,
      createdAt: true,
      selfieUrl: true,
      localFaceDetected: true,
      localFaceCount: true,
      localDistrictMatched: true,
      localConfidence: true,
      localReasons: true,
      user: {
        select: {
          email: true,
          nickname: true,
          name: true,
        },
      },
    },
    take: 300,
  });

  const rows: AdminPendingValidationRow[] = pending.map((submission) => ({
    id: submission.id,
    userLabel: submission.user.nickname ?? submission.user.name ?? "Neznámý hráč",
    userEmail: submission.user.email,
    districtCode: submission.districtCode,
    districtName: submission.districtName,
    submittedAt: submission.createdAt.toISOString(),
    selfieUrl: submission.selfieUrl,
    localFaceDetected: submission.localFaceDetected,
    localFaceCount: submission.localFaceCount,
    localDistrictMatched: submission.localDistrictMatched,
    localConfidence: submission.localConfidence,
    localReasons: toReasonList(submission.localReasons),
  }));

  const metroVars = {
    "--metro-bg": "#06141d",
    "--metro-panel": "#0c202e",
    "--metro-ink": "#e6fbff",
  } as CSSProperties;

  return (
    <main className={metro.routeShell} style={metroVars}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-60`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[var(--metro-panel)]/80 p-6 shadow-[0_24px_50px_rgba(0,0,0,0.45)] sm:p-8 ${metro.mobilePanel}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Administrace
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
                Čekající validace selfie
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
                Lokální kontrola (obličej + text cedule) žádost neuzavřela automaticky.
                Zde může ADMIN žádost ručně schválit nebo zamítnout.
              </p>
            </div>
            <Link
              href="/admin"
              className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
            >
              Zpět do administrace
            </Link>
          </div>

          <div className="mt-8">
            <AdminPendingValidationsTable submissions={rows} />
          </div>
        </div>
      </section>
    </main>
  );
}
