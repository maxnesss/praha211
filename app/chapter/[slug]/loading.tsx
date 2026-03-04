import {
  BadgeGridSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <SkeletonBlock className="mt-6 h-4 w-36 rounded-md" />
      <SkeletonBlock className="mt-4 h-9 w-56 rounded-md" />
      <SkeletonBlock className="mt-3 h-4 w-44 rounded-md" />

      <BadgeGridSkeleton
        count={20}
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      />
    </MetroPageSkeleton>
  );
}
