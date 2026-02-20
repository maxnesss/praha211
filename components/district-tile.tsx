import Link from "next/link";
import { CoatOfArms } from "@/components/coat-of-arms";
import type { DistrictDefinition } from "@/lib/game/praha112";

type DistrictTileProps = {
  district: DistrictDefinition;
  completed: boolean;
};

export function DistrictTile({ district, completed }: DistrictTileProps) {
  return (
    <Link
      href={`/district/${district.code}`}
      className={`group relative overflow-hidden rounded-lg border p-3 transition-all ${
        completed
          ? "border-emerald-300/50 bg-emerald-500/15 shadow-[0_0_24px_rgba(16,185,129,0.22)]"
          : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {district.code}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            completed
              ? "bg-emerald-300/20 text-emerald-200"
              : "bg-slate-800 text-slate-400"
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
        className={`mt-3 text-sm font-medium leading-snug ${
          completed ? "text-slate-100" : "text-slate-300"
        }`}
      >
        {district.name}
      </p>
    </Link>
  );
}
