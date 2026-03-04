import {
  MetroPageSkeleton,
  SkeletonBlock,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SkeletonBlock className="h-3 w-24 rounded-md" />
          <SkeletonBlock className="mt-3 h-10 w-56 rounded-md" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-28 rounded-md" />
          <SkeletonBlock className="h-9 w-36 rounded-md" />
        </div>
      </div>

      <StatCardsSkeleton count={4} className="mt-6 grid gap-3 sm:grid-cols-4" />
    </MetroPageSkeleton>
  );
}
