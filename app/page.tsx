import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[24%] h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="hero-grain absolute inset-0 opacity-25" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#02040b] via-[#02040b]/70 to-transparent" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 py-8 text-center sm:px-8 sm:py-14 lg:-mt-6">
        <Image
          src="/logo/praha-tr.png"
          alt="PRAHA 112 logo"
          width={900}
          height={900}
          priority
          className="hero-logo-motion h-[20rem] w-[20rem] object-contain drop-shadow-[0_0_48px_rgba(245,158,11,0.45)] sm:h-[28rem] sm:w-[28rem] lg:h-[36rem] lg:w-[36rem]"
        />

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          Praha 112
        </p>
        <h1 className="mt-4 max-w-[22ch] text-[clamp(2rem,4.6vw,4.2rem)] leading-[1.08] tracking-tight text-slate-100">
          <span className="block">Jedna výzva.</span>
          <span className="mt-1 block">112 městských částí.</span>
          <span className="mt-1 block text-slate-300">
            Jediný cíl: dokončit celou Prahu.
          </span>
        </h1>

        <div className="mt-11 flex w-full max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
          {session?.user ? (
            <Link
              href="/overview"
              className="w-full rounded-xl bg-amber-500 px-7 py-3 text-base font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-[0_8px_22px_rgba(245,158,11,0.36)] sm:w-auto"
            >
              Pokračovat do přehledu
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="w-full rounded-xl bg-amber-500 px-7 py-3 text-base font-semibold text-slate-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-[0_8px_22px_rgba(245,158,11,0.36)] sm:w-auto"
              >
                Přihlásit se
              </Link>
              <Link
                href="/sign-up"
                className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-7 py-3 text-base font-semibold text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
              >
                Vytvořit účet
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
