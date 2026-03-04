import {
  MetroPageSkeleton,
  SkeletonBlock,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <div className="mt-6 flex items-center gap-3">
        <SkeletonBlock className="h-3 w-16 rounded-md" />
        <SkeletonBlock className="h-3 w-4 rounded-md" />
        <SkeletonBlock className="h-3 w-20 rounded-md" />
        <SkeletonBlock className="h-3 w-4 rounded-md" />
        <SkeletonBlock className="h-3 w-32 rounded-md" />
      </div>

      <section className="mt-6 rounded-2xl border border-cyan-300/30 bg-[#091925]/70 p-6">
        <SkeletonBlock className="h-3 w-24 rounded-md" />
        <SkeletonBlock className="mt-3 h-9 w-64 max-w-full rounded-md" />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(14rem,20rem)_1fr]">
          <SkeletonBlock className="aspect-[4/5] w-full rounded-xl" />
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-36 rounded-md" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-24 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </section>
    </MetroPageSkeleton>
  );
}
