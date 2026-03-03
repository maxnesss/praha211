"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import metro from "@/app/metro-theme.module.css";
import { DISTRICTS } from "@/lib/game/district-catalog";

const MIN_QUERY_LENGTH = 4;
const MAX_VISIBLE_RESULTS = 8;

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function OverviewDistrictSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const normalizedQuery = normalizeSearchValue(query);
  const shouldShowDropdown = isFocused && normalizedQuery.length >= MIN_QUERY_LENGTH;

  const matches = useMemo(() => {
    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    return DISTRICTS.filter((district) =>
      normalizeSearchValue(district.name).includes(normalizedQuery),
    ).slice(0, MAX_VISIBLE_RESULTS);
  }, [normalizedQuery]);

  return (
    <div className={`mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-500/5 p-4 ${metro.mobileCard}`}>
      <div className="relative">
        <input
          id="district-search"
          aria-label="Najdi čtvrť"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 120);
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Vyhledej čtvrť"
          className="w-full rounded-xl border border-cyan-300/35 bg-[#081823] px-3 py-2 text-sm text-cyan-50 outline-none transition placeholder:text-cyan-200/45 focus:border-cyan-200/80"
        />

        {shouldShowDropdown ? (
          <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-cyan-300/35 bg-[#061720] shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
            {matches.length > 0 ? (
              <ul className="max-h-72 overflow-y-auto py-1">
                {matches.map((district) => (
                  <li key={district.code} className="px-2 py-1">
                    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-cyan-500/10">
                      <Link
                        href={`/district/${district.code}`}
                        className="min-w-0 flex-1 text-sm text-cyan-50"
                      >
                        <span className="font-medium">{district.name}</span>
                      </Link>

                      <Link
                        href={`/chapter/${district.chapterSlug}`}
                        className="shrink-0 rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/20"
                      >
                        {district.chapterName}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-cyan-100/75">Městská část nebyla nalezena.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
