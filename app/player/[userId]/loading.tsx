import {
  BadgeGridSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <div className="mt-6 flex items-center gap-4 rounded-xl border border-cyan-300/25 bg-cyan-500/5 p-4">
        <SkeletonBlock className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-5 w-48 rounded-md" />
          <SkeletonBlock className="mt-2 h-3 w-32 rounded-md" />
          <SkeletonBlock className="mt-2 h-3 w-40 rounded-md" />
        </div>
      </div>

      <StatCardsSkeleton count={4} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" />

      <section className="mt-6 rounded-xl border border-cyan-300/25 bg-[#091925]/75 p-4">
        <SkeletonBlock className="h-4 w-32 rounded-md" />
        <BadgeGridSkeleton
          count={16}
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8"
        />
      </section>
    </MetroPageSkeleton>
  );
}
