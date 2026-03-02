import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";
import { SITE_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Domů",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PRAHA 112",
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/radnice");
  }

  return (
    <main className={`${metro.routeShell}`} style={{ minHeight: "100%" }}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-50`} />
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[120px]" />

      <section className="relative mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center px-4 py-4 text-center sm:px-8 sm:py-6">
        <div className={`${metro.pageReveal} w-full max-w-5xl rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-5 shadow-[0_24px_56px_rgba(0,0,0,0.48)] sm:p-7`}>
          <Image
            src="/logo/praha-tr.png"
            alt="PRAHA 112 logo"
            width={900}
            height={900}
            priority
            className="hero-logo-motion mx-auto h-[clamp(9rem,28vh,18rem)] w-[clamp(9rem,28vh,18rem)] object-contain drop-shadow-[0_0_38px_rgba(34,211,238,0.44)] sm:h-[clamp(10rem,31vh,20rem)] sm:w-[clamp(10rem,31vh,20rem)]"
          />

          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/85">
            Praha 112
          </p>
          <h1 className="mt-3 text-[clamp(1.7rem,4.1vw,3.7rem)] leading-[1.04] tracking-tight text-cyan-50">
            <span className="block">Jedna výzva.</span>
            <span className="mt-1 block">112 městských částí.</span>
            <span className="mt-1 block text-cyan-100/85">
              Jediný cíl: dokončit celou Prahu.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-cyan-100/75 sm:text-base">
            Přihlaste se, sledujte body, denní sérii a postup v kapitolách jako živý
            dispečerský panel.
          </p>

          <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-7 sm:flex-row">
            <Link
              href="/sign-in"
              className="w-full rounded-xl border border-cyan-300/45 bg-cyan-400/15 px-7 py-3 text-base font-semibold text-cyan-50 transition-all hover:-translate-y-0.5 hover:bg-cyan-400/25 sm:w-auto"
            >
              Přihlásit se
            </Link>
            <Link
              href="/sign-up"
              className="w-full rounded-xl border border-orange-300/60 bg-orange-400/20 px-7 py-3 text-base font-semibold text-orange-50 transition-all hover:-translate-y-0.5 hover:bg-orange-400/30 sm:w-auto"
            >
              Vytvořit účet
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
