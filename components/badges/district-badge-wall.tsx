"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { coatImageLoader } from "@/lib/game/coat-image-loader";

const INITIAL_VISIBLE_COUNT = 48;
const VISIBLE_BATCH_SIZE = 32;

export type DistrictBadgeWallItem = {
  code: string;
  name: string;
  coatAssetKey: string;
  unlocked: boolean;
  accentColor: string;
};

type DistrictBadgeWallProps = {
  badges: DistrictBadgeWallItem[];
};

function DistrictCoatTile({ badge }: { badge: DistrictBadgeWallItem }) {
  const unlockedStyle = badge.unlocked
    ? {
        borderColor: `${badge.accentColor}bb`,
        boxShadow: `0 0 14px ${badge.accentColor}2d`,
      }
    : undefined;

  return (
    <Link
      href={`/district/${badge.code}`}
      aria-label={`${badge.code} ${badge.name}`}
      title={`${badge.code} · ${badge.name}`}
      className={`group block rounded-md border p-1 transition-transform hover:-translate-y-0.5 ${
        badge.unlocked
          ? "border-cyan-300/30 bg-cyan-500/8"
          : "border-cyan-300/15 bg-[#08161f]/55 opacity-80 grayscale"
      }`}
      style={unlockedStyle}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-sm">
        <Image
          src={`/coats/${badge.coatAssetKey}.png`}
          alt={`${badge.name} znak`}
          fill
          loader={coatImageLoader}
          sizes="(max-width: 640px) 22vw, (max-width: 1024px) 14vw, 56px"
          quality={55}
          className={`object-cover ${badge.unlocked ? "" : "grayscale"}`}
        />
      </div>
    </Link>
  );
}

export function DistrictBadgeWall({ badges }: DistrictBadgeWallProps) {
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(INITIAL_VISIBLE_COUNT, badges.length),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visibleCount >= badges.length) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) {
          return;
        }

        setVisibleCount((current) =>
          Math.min(current + VISIBLE_BATCH_SIZE, badges.length),
        );
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [badges.length, visibleCount]);

  const visibleBadges = badges.slice(0, visibleCount);
  const hasMore = visibleCount < badges.length;

  return (
    <>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-14">
        {visibleBadges.map((badge) => (
          <DistrictCoatTile key={badge.code} badge={badge} />
        ))}
      </div>

      {hasMore ? <div ref={sentinelRef} className="mt-2 h-2 w-full" aria-hidden /> : null}
    </>
  );
}
