"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  return (
    <footer className="border-t border-cyan-300/10 bg-[#071824]/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-cyan-100/55 sm:px-8">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="tracking-wide transition-colors hover:text-cyan-100/75"
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
        >
          &copy; {year} PRAHA 112
        </button>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center bg-[#02090f]/72 p-4 sm:items-center"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Informace"
            className="w-full max-w-xs rounded-xl border border-cyan-300/25 bg-[#081823]/95 p-4 text-sm text-cyan-100 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/75">
              Informace
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/kontaktujte-nas"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-md border border-cyan-300/25 bg-cyan-500/8 px-3 py-2 text-center transition-colors hover:bg-cyan-500/15"
              >
                Kontakt
              </Link>
              <Link
                href="/ochrana-osobnich-udaju"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-md border border-cyan-300/25 bg-cyan-500/8 px-3 py-2 text-center transition-colors hover:bg-cyan-500/15"
              >
                Ochrana osobních údajů
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mt-3 w-full rounded-md border border-orange-300/50 bg-orange-400/15 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-orange-50 transition-colors hover:bg-orange-400/25"
            >
              Zavřít
            </button>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
