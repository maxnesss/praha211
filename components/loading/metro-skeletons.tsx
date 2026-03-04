import type { ReactNode } from "react";
import metro from "@/app/metro-theme.module.css";

type SkeletonBlockProps = {
  className: string;
};

type MetroPageSkeletonProps = {
  children: ReactNode;
};

type StatCardsSkeletonProps = {
  count?: number;
  className?: string;
};

type CardGridSkeletonProps = {
  count: number;
  className: string;
};

type BadgeGridSkeletonProps = {
  count: number;
  className: string;
};

type ListRowsSkeletonProps = {
  count?: number;
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div aria-hidden="true" className={`skeleton-shimmer ${className}`} />;
}

export function MetroPageSkeleton({ children }: MetroPageSkeletonProps) {
  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />

      <header className="relative mx-auto w-full max-w-7xl px-4 pt-4 sm:px-8">
        <div className="flex items-center justify-between rounded-xl border border-cyan-300/25 bg-[#0b1d2a]/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-4 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8 w-16 rounded-md" />
            <SkeletonBlock className="h-8 w-16 rounded-md" />
            <SkeletonBlock className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </header>

      <section className={metro.shellContent}>
        <div className={`rounded-3xl border border-cyan-300/35 bg-[#0c202e]/80 p-6 shadow-[0_20px_44px_rgba(0,0,0,0.44)] sm:p-8 ${metro.mobilePanel}`}>
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-28 rounded-md" />
            <SkeletonBlock className="h-10 w-72 max-w-full rounded-md" />
            <SkeletonBlock className="h-4 w-full max-w-2xl rounded-md" />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export function StatCardsSkeleton({
  count = 4,
  className = "mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4",
}: StatCardsSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={`stat-skeleton-${index}`}
          className="rounded-lg border border-cyan-300/25 bg-cyan-500/8 p-3 sm:rounded-xl sm:bg-cyan-500/5 sm:p-4"
        >
          <SkeletonBlock className="h-3 w-20 rounded-md" />
          <SkeletonBlock className="mt-2 h-7 w-24 rounded-md" />
        </article>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count, className }: CardGridSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={`card-skeleton-${index}`}
          className="rounded-2xl border border-cyan-300/30 bg-[#091925]/70 p-5"
        >
          <SkeletonBlock className="h-5 w-2/3 rounded-md" />
          <SkeletonBlock className="mt-3 h-3 w-1/3 rounded-md" />
          <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
          <div className="mt-4 grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }, (_, meterIndex) => (
              <SkeletonBlock key={`meter-${index}-${meterIndex}`} className="h-2 rounded-sm" />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function BadgeGridSkeleton({ count, className }: BadgeGridSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={`badge-skeleton-${index}`}
          className="rounded-md border border-cyan-300/25 bg-[#08161f]/70 p-1.5"
        >
          <SkeletonBlock className="aspect-square w-full rounded-sm" />
          <SkeletonBlock className="mt-2 h-2 w-3/4 rounded-sm" />
        </article>
      ))}
    </div>
  );
}

export function ListRowsSkeleton({
  count = 8,
  className = "mt-4 divide-y divide-cyan-300/20",
}: ListRowsSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div key={`row-skeleton-${index}`} className="py-3">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-7 w-7 rounded-full" />
            <SkeletonBlock className="h-4 w-40 rounded-md" />
            <SkeletonBlock className="ml-auto h-4 w-14 rounded-md" />
          </div>
          <SkeletonBlock className="mt-2 h-3 w-48 rounded-md" />
        </div>
      ))}
    </div>
  );
}
