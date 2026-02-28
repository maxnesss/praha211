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
      className="group block rounded-xl border border-cyan-300/20 bg-[#08161f]/35 p-2 transition-colors hover:border-cyan-200/35"
    >
      <CoatOfArms
        assetKey={district.coatAssetKey}
        name={district.name}
        className={`aspect-square w-full ${completed ? "" : "grayscale"}`}
      />
      <p
        className={`mt-3 px-1 text-center text-sm font-medium leading-snug ${
          completed ? "text-cyan-50" : "text-cyan-100/82"
        }`}
      >
        {district.name}
      </p>
      <div className="mt-2 flex justify-center px-1 pb-0.5">
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
    </Link>
  );
}
