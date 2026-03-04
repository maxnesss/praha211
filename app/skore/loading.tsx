import {
  ListRowsSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton count={5} className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-5" />
      <section className="mt-6 rounded-xl border border-orange-300/40 bg-orange-400/10 p-4">
        <SkeletonBlock className="h-3 w-40 rounded-md" />
        <SkeletonBlock className="mt-2 h-6 w-80 max-w-full rounded-md" />
      </section>
      <ListRowsSkeleton count={10} className="mt-8 divide-y divide-cyan-300/20" />
    </MetroPageSkeleton>
  );
}
