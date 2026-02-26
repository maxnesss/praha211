import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import metro from "@/app/metro-theme.module.css";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-50`} />
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-300/10 blur-[120px]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-5 py-10 text-center sm:px-10">
        <div className={`${metro.pageReveal} w-full max-w-5xl rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-7 shadow-[0_24px_56px_rgba(0,0,0,0.48)] sm:p-10`}>
          <Image
            src="/logo/praha-tr.png"
            alt="PRAHA 112 logo"
            width={900}
            height={900}
            priority
            className="hero-logo-motion mx-auto h-[15rem] w-[15rem] object-contain drop-shadow-[0_0_38px_rgba(34,211,238,0.44)] sm:h-[20rem] sm:w-[20rem] lg:h-[24rem] lg:w-[24rem]"
          />

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/85">
            Praha 112
          </p>
          <h1 className="mt-4 text-[clamp(2rem,4.6vw,4.2rem)] leading-[1.08] tracking-tight text-cyan-50">
            <span className="block">Jedna výzva.</span>
            <span className="mt-1 block">112 městských částí.</span>
            <span className="mt-1 block text-cyan-100/85">
              Jediný cíl: dokončit celou Prahu.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
            Přihlaste se, sledujte body, denní sérii a postup v kapitolách jako živý
            dispečerský panel.
          </p>

          <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            {session?.user ? (
              <Link
                href="/overview"
                className="w-full rounded-xl border border-orange-300/60 bg-orange-400/20 px-7 py-3 text-base font-semibold text-orange-50 transition-all hover:-translate-y-0.5 hover:bg-orange-400/30 sm:w-auto"
              >
                Pokračovat do přehledu
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
