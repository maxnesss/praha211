"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export function GameInfoFab() {
  const [isOpen, setIsOpen] = useState(false);
  const canPortal = typeof document !== "undefined";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Otevřít pravidla hry"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/35 bg-[#091a26]/88 text-cyan-100/75 shadow-[0_8px_16px_rgba(0,0,0,0.28)] transition-colors hover:bg-[#0d2230]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      </button>

      {isOpen && canPortal
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#02090f]/70 p-4 sm:p-5">
              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Informace o hře a pravidla"
                className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-cyan-300/35 bg-[#0c202e]/96 p-6 shadow-[0_28px_58px_rgba(0,0,0,0.55)] sm:max-h-[calc(100vh-3rem)] sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
                      PRAHA 112
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-cyan-50">
                      Informace a pravidla
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md border border-cyan-300/35 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition-colors hover:bg-cyan-500/15"
                  >
                    Zavřít
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <section className="rounded-xl border border-cyan-300/30 bg-cyan-500/[0.06] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">
                      Vítejte
                    </h3>
                    <div className="mt-3 space-y-2.5 text-sm leading-6 text-cyan-50/90">
                      <p>
                        Cílem je odemknout všech <strong>112</strong> pražských katastrálních
                        území.
                      </p>
                      <p>
                        Objevujte město po svém, sbírejte body, budujte sérii a posouvejte svůj
                        postup v mapě Prahy.
                      </p>
                      <p className="rounded-lg border border-orange-300/35 bg-orange-400/10 px-3 py-2 text-orange-100">
                        Týmy: 1 hráč může být jen v 1 týmu, tým má maximálně 5 členů.
                      </p>
                    </div>
                  </section>

                  <section className="rounded-xl border border-cyan-300/30 bg-cyan-500/[0.06] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-100">
                      Pravidla
                    </h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-cyan-100/90">
                      <li>Dokončení je konečné: 112/112.</li>
                      <li>Body jsou nekonečné: základ + denní násobitel + bonus za sérii.</li>
                      <li>Každou městskou část můžete potvrdit jen jednou.</li>
                      <li>Pro odemčení je potřeba selfie s oficiální cedulí městské části.</li>
                      <li>Hrajte fair-play: potvrzujte jen místa, která jste opravdu navštívili.</li>
                    </ul>
                  </section>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
