import Link from "next/link";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/sign-out-button";

type SiteHeaderProps = {
  session: Session | null;
};

export function SiteHeader({ session }: SiteHeaderProps) {
  const homeHref = session?.user ? "/overview" : "/";

  return (
    <header className="border-b border-slate-800 bg-slate-950/90">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-10">
        <div className="flex items-center gap-6">
          <Link
            href={homeHref}
            className="text-lg font-semibold tracking-[0.08em] text-slate-100"
          >
            PRAHA 112
          </Link>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-slate-400 sm:inline">
            Systém dokončení
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
          {session?.user ? (
            <>
              <span className="hidden rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 sm:inline">
                {session.user.role}
              </span>
              <span className="hidden text-slate-400 md:inline">
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-900"
              >
                Přihlásit se
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-amber-500 px-3 py-1.5 text-slate-950 transition-colors hover:bg-amber-400"
              >
                Registrovat se
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
