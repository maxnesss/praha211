import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] px-6 text-slate-100">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Chyba 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Stránka nebyla nalezena
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Odkaz je neplatný nebo stránka už neexistuje.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
        >
          Zpět na přehled
        </Link>
      </div>
    </main>
  );
}
