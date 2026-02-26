"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CoatOfArmsProps = {
  assetKey: string;
  code: string;
  name: string;
  sizes?: string;
  className?: string;
  loadingStrategy?: "lazy" | "eager";
};

export function CoatOfArms({
  assetKey,
  code,
  name,
  sizes = "(max-width: 768px) 35vw, 180px",
  className,
  loadingStrategy = "lazy",
}: CoatOfArmsProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isEager = loadingStrategy === "eager";
  const [shouldRenderImage, setShouldRenderImage] = useState(isEager);
  const [mode, setMode] = useState<"primary" | "fallback" | "placeholder">(
    "primary",
  );
  const resolvedAssetKey = mode === "primary" ? assetKey : "karlin";

  useEffect(() => {
    if (isEager || shouldRenderImage) {
      return;
    }

    const element = rootRef.current;
    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const timeoutId = setTimeout(() => {
        setShouldRenderImage(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) {
          return;
        }
        setShouldRenderImage(true);
        observer.disconnect();
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isEager, shouldRenderImage]);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden rounded-md border border-cyan-300/25 bg-[#08161f] ${className ?? ""}`}
    >
      {mode !== "placeholder" && shouldRenderImage ? (
        <Image
          src={`/coats/${resolvedAssetKey}.png`}
          alt={`${name} znak městské části`}
          fill
          sizes={sizes}
          loading={isEager ? "eager" : "lazy"}
          quality={70}
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
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(140deg,#153346_0%,#0d2230_70%,#071824_100%)] text-center">
          <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
            {code}
          </span>
        </div>
      )}
    </div>
  );
}
