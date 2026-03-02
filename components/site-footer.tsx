import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cyan-300/10 bg-[#071824]/70 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-cyan-100/55 sm:px-8">
        <p className="tracking-wide">&copy; {year} PRAHA 112</p>
        <div className="mt-1.5 flex items-center justify-center gap-3">
          <Link
            href="/kontaktujte-nas"
            className="tracking-wide transition-colors hover:text-cyan-100/75"
          >
            Kontakt
          </Link>
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
