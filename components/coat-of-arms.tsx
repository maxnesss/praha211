"use client";

import { useState } from "react";

type CoatOfArmsProps = {
  assetKey: string;
  code: string;
  name: string;
  sizes?: string;
  className?: string;
};

export function CoatOfArms({
  assetKey,
  code,
  name,
  sizes = "(max-width: 768px) 35vw, 180px",
  className,
}: CoatOfArmsProps) {
  const [mode, setMode] = useState<"primary" | "fallback" | "placeholder">(
    "primary",
  );
  const resolvedAssetKey = mode === "primary" ? assetKey : "karlin";

  return (
    <div
      className={`relative overflow-hidden rounded-md border border-slate-700 bg-slate-950 ${className ?? ""}`}
    >
      {mode !== "placeholder" ? (
        <img
          src={`/coats/${resolvedAssetKey}.png`}
          srcSet={`/coats/${resolvedAssetKey}.png 1x`}
          sizes={sizes}
          alt={`${name} coat of arms`}
          loading="lazy"
          decoding="async"
          onError={() => {
            if (mode === "primary" && assetKey !== "karlin") {
              setMode("fallback");
              return;
            }
            setMode("placeholder");
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(140deg,#202733_0%,#101621_70%,#090d14_100%)] text-center">
          <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            {code}
          </span>
        </div>
      )}
    </div>
  );
}
