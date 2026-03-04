import {
  ListRowsSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <section className="mt-6 border-t border-cyan-300/20 pt-5">
        <SkeletonBlock className="h-3 w-24 rounded-md" />
        <SkeletonBlock className="mt-2 h-7 w-48 rounded-md" />
      </section>

      <section className="mt-6 border-t border-cyan-300/20 pt-5">
        <SkeletonBlock className="h-4 w-28 rounded-md" />
        <SkeletonBlock className="mt-4 h-10 w-full rounded-xl" />
        <ListRowsSkeleton count={8} />
      </section>
    </MetroPageSkeleton>
  );
}
