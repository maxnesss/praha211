import Link from "next/link";
import metro from "@/app/metro-theme.module.css";

export default function NotFound() {
  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className={`${metro.pageReveal} w-full max-w-lg rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-8 text-center shadow-[0_20px_48px_rgba(0,0,0,0.5)]`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
            Chyba 404
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50">
            Stránka nebyla nalezena
          </h1>
          <p className="mt-3 text-sm leading-7 text-cyan-100/75">
            Odkaz je neplatný nebo stránka už neexistuje.
          </p>
          <Link
            href="/radnice"
            className="mt-6 inline-flex rounded-md border border-orange-300/60 bg-orange-400/20 px-4 py-2 text-sm font-semibold text-orange-50 transition-colors hover:bg-orange-400/30"
          >
            Zpět do radnice
          </Link>
        </div>
      </section>
    </main>
  );
}
