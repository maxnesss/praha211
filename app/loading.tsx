import {
  BadgeGridSkeleton,
  CardGridSkeleton,
  MetroPageSkeleton,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton />
      <CardGridSkeleton
        count={4}
        className="mt-8 grid gap-4 md:grid-cols-2"
      />
      <BadgeGridSkeleton
        count={10}
        className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10"
      />
    </MetroPageSkeleton>
  );
}
