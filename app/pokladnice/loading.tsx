import {
  BadgeGridSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton count={5} className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-5" />

      <section className="mt-8">
        <SkeletonBlock className="h-4 w-44 rounded-md" />
        <BadgeGridSkeleton
          count={28}
          className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-14"
        />
      </section>

      <section className="mt-6 border-t border-cyan-300/20 pt-6">
        <SkeletonBlock className="h-4 w-32 rounded-md" />
        <BadgeGridSkeleton
          count={14}
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
        />
      </section>

      <section className="mt-6 border-t border-cyan-300/20 pt-6">
        <SkeletonBlock className="h-4 w-40 rounded-md" />
        <BadgeGridSkeleton
          count={22}
          className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-11"
        />
      </section>
    </MetroPageSkeleton>
  );
}
