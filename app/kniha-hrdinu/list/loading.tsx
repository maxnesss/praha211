import {
  ListRowsSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton count={3} className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3" />
      <div className="mt-6 border-t border-cyan-300/20 pt-5">
        <SkeletonBlock className="h-4 w-28 rounded-md" />
        <SkeletonBlock className="mt-3 h-10 w-full rounded-xl" />
      </div>
      <ListRowsSkeleton count={12} className="mt-8 divide-y divide-cyan-300/20" />
    </MetroPageSkeleton>
  );
}
