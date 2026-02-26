import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cyan-300/10 bg-[#071824]/70 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-cyan-100/55 sm:px-8">
        <Link
          href="/kontaktujte-nas"
          className="tracking-wide transition-colors hover:text-cyan-100/75"
        >
          &copy; {year} PRAHA 112
        </Link>
      </div>
    </footer>
  );
}
