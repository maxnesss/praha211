import {
  MetroPageSkeleton,
  SkeletonBlock,
} from "@/components/loading/metro-skeletons";

export default function Loading() {
  return (
    <MetroPageSkeleton>
      <SkeletonBlock className="mt-6 h-3 w-16 rounded-md" />
      <SkeletonBlock className="mt-3 h-10 w-64 max-w-full rounded-md" />
      <SkeletonBlock className="mt-4 h-4 w-full max-w-2xl rounded-md" />

      <div className="mt-8 space-y-4">
        <section className="rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
          <SkeletonBlock className="h-4 w-36 rounded-md" />
          <SkeletonBlock className="mt-4 h-10 w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-10 w-full rounded-xl" />
        </section>

        <section className="rounded-2xl border border-cyan-300/30 bg-[#091925]/75 p-4">
          <SkeletonBlock className="h-4 w-32 rounded-md" />
          <SkeletonBlock className="mt-4 h-10 w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-10 w-full rounded-xl" />
          <SkeletonBlock className="mt-3 h-10 w-40 rounded-xl" />
        </section>
      </div>
    </MetroPageSkeleton>
  );
}
