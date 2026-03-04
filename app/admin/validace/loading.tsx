import {
  ListRowsSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SkeletonBlock className="h-3 w-24 rounded-md" />
          <SkeletonBlock className="mt-3 h-10 w-64 rounded-md" />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-xl rounded-md" />
        </div>
        <SkeletonBlock className="h-9 w-40 rounded-md" />
      </div>

      <section className="mt-8 rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
        <SkeletonBlock className="h-4 w-44 rounded-md" />
        <ListRowsSkeleton count={10} className="mt-4 divide-y divide-cyan-300/20" />
      </section>
    </MetroPageSkeleton>
  );
}
