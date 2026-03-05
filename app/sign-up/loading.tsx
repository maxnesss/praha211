import metro from "@/app/metro-theme.module.css";
import { SkeletonBlock } from "@/components/loading/metro-skeletons";

export default function SignUpLoading() {
  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className={`${metro.pageReveal} w-full max-w-md rounded-2xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.5)] sm:p-8 ${metro.mobilePanel}`}>
          <SkeletonBlock className="h-8 w-40 rounded-md" />
          <SkeletonBlock className="mt-3 h-4 w-64 rounded-md" />

          <div className="mt-6 space-y-4">
            <SkeletonBlock className="h-10 w-full rounded-md" />
            <SkeletonBlock className="h-10 w-full rounded-md" />
            <SkeletonBlock className="h-10 w-full rounded-md" />
            <SkeletonBlock className="h-10 w-full rounded-md" />
            <SkeletonBlock className="h-10 w-full rounded-md" />
            <SkeletonBlock className="h-10 w-full rounded-md" />
            <SkeletonBlock className="h-11 w-full rounded-md" />
          </div>

          <SkeletonBlock className="mt-6 h-4 w-44 rounded-md" />
        </div>
      </section>
    </main>
  );
}
