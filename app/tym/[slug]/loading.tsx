import {
  ListRowsSkeleton,
  MetroPageSkeleton,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton count={4} className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" />
      <ListRowsSkeleton count={9} className="mt-8 divide-y divide-cyan-300/20" />
    </MetroPageSkeleton>
  );
}
