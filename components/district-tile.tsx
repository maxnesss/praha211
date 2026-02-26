import Link from "next/link";
import { CoatOfArms } from "@/components/coat-of-arms";
import type { DistrictDefinition } from "@/lib/game/district-catalog";

type DistrictTileProps = {
  district: DistrictDefinition;
  completed: boolean;
};

export function DistrictTile({ district, completed }: DistrictTileProps) {
  return (
    <Link
      href={`/district/${district.code}`}
      className="group block rounded-none p-0"
    >
      <div className="flex items-start justify-between gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/65">
          {district.code}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            completed
              ? "bg-orange-400/20 text-orange-100"
              : "bg-cyan-950/80 text-cyan-200/60"
          }`}
        >
          {completed ? "Odemčeno" : "Zamčeno"}
        </span>
      </div>
      <CoatOfArms
        assetKey={district.coatAssetKey}
        code={district.code}
        name={district.name}
        className={`mt-3 aspect-square w-full ${completed ? "" : "grayscale"}`}
      />
      <p
        className={`mt-3 px-1 text-sm font-medium leading-snug ${
          completed ? "text-cyan-50" : "text-cyan-100/82"
        }`}
      >
        {district.name}
      </p>
    </Link>
  );
}
