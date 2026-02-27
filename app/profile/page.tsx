import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileSettingsForms } from "@/components/profile-settings-forms";
import { SiteHeader } from "@/components/site-header";
import metro from "@/app/metro-theme.module.css";
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
      name: true,
      email: true,
      nickname: true,
      avatar: true,
      passwordHash: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/sign-in?callbackUrl=%2Fprofile");
  }

  return (
    <main className={`${metro.routeShell}`}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <SiteHeader session={session} />

      <section className={metro.shellContent}>
        <div className={`${metro.pageReveal} rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8`}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            Profil
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-50 sm:text-4xl">
            Informace o účtu
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cyan-100/75 sm:text-base">
            Přehled vašeho účtu pro výzvu PRAHA 112.
          </p>

          <ProfileSettingsForms
            name={user.name}
            email={user.email}
            hasPassword={Boolean(user.passwordHash)}
            initialNickname={user.nickname}
            initialAvatar={user.avatar}
            role={user.role}
            showRole={session.user.role === "ADMIN"}
          />
        </div>
      </section>
    </main>
  );
}
