import {
  ListRowsSkeleton,
  MetroPageSkeleton,
  StatCardsSkeleton,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <StatCardsSkeleton count={3} className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3" />
      <ListRowsSkeleton count={10} className="mt-8 divide-y divide-cyan-300/20" />
    </MetroPageSkeleton>
  );
}
