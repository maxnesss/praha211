import {
  CardGridSkeleton,
  MetroPageSkeleton,
  SkeletonBlock,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        <section className="rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
          <SkeletonBlock className="h-4 w-28 rounded-md" />
          <SkeletonBlock className="mt-4 h-10 w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-10 w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-24 w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-10 w-full rounded-xl" />
        </section>

        <section className="rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
          <SkeletonBlock className="h-4 w-32 rounded-md" />
          <CardGridSkeleton
            count={6}
            className="mt-4 grid gap-2"
          />
        </section>
      </div>
    </MetroPageSkeleton>
  );
}
