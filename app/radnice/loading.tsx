import {
  CardGridSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton />
      <div className="mt-6">
        <SkeletonBlock className="h-10 w-full rounded-xl" />
      </div>
      <CardGridSkeleton
        count={6}
        className="mt-8 grid gap-4 lg:grid-cols-2"
      />
    </MetroPageSkeleton>
  );
}
