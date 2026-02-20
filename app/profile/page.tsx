import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }

  const formattedCreatedAt = new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(user.createdAt);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#202938_0%,#0b1018_45%,#06080d_100%)] text-slate-100">
      <SiteHeader session={session} />

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          Profil
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Informace o účtu
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Přehled vašeho účtu pro výzvu PRAHA 112.
        </p>

        <article className="mt-8 max-w-2xl rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-[180px,1fr] sm:items-center">
            <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">
              Jméno
            </dt>
            <dd className="text-slate-100">{user.name ?? "Neuvedeno"}</dd>

            <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">
              E-mail
            </dt>
            <dd className="text-slate-100">{user.email}</dd>

            <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">
              Role
            </dt>
            <dd className="text-slate-100">{user.role}</dd>

            <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">
              Vytvořeno
            </dt>
            <dd className="text-slate-100">{formattedCreatedAt}</dd>

            <dt className="font-semibold uppercase tracking-[0.14em] text-slate-400">
              ID uživatele
            </dt>
            <dd className="break-all text-slate-100">{user.id}</dd>
          </dl>

          <div className="mt-8">
            <SignOutButton />
          </div>
        </article>
      </section>
    </main>
  );
}
