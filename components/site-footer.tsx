import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cyan-300/10 bg-[#071824]/70 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-cyan-100/55 sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <Link
            href="/kontaktujte-nas"
            className="tracking-wide transition-colors hover:text-cyan-100/75"
          >
            Kontakt
          </Link>
          <span aria-hidden="true">•</span>
          <p className="tracking-wide whitespace-nowrap">&copy; {year} PRAHA 112</p>
          <span aria-hidden="true">•</span>
          <Link
            href="/ochrana-osobnich-udaju"
            className="tracking-wide transition-colors hover:text-cyan-100/75"
          >
            Ochrana osobních údajů
          </Link>
        </div>
      </div>
    </footer>
  );
}
