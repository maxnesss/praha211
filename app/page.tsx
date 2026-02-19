import Link from "next/link";
import { getServerSession } from "next-auth";
import { SignOutButton } from "@/components/sign-out-button";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-10">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Praha211
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
            {session?.user ? (
              <>
                <span className="hidden text-slate-700 sm:inline">
                  {session.user.email} ({session.user.role})
                </span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="transition-colors hover:text-slate-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-white transition-colors hover:bg-slate-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          {session?.user ? "You are signed in" : "Welcome"}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          NextAuth, Prisma users, and role-based auth are ready to use.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Roles currently available are <code>ADMIN</code> and <code>USER</code>
          . New sign-ups are created as <code>USER</code> by default.
        </p>
        {!session?.user && (
          <div className="mt-8 flex gap-3">
            <Link
              href="/sign-up"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              Create account
            </Link>
            <Link
              href="/sign-in"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Sign in
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
