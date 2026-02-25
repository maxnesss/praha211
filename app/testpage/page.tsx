import type { Metadata } from "next";
import styles from "./testpage.module.css";

type FontPreview = {
  id: string;
  label: string;
  className: string;
  note: string;
};

const fontPreviews: FontPreview[] = [
  {
    id: "cinzel",
    label: "Cinzel Decorative",
    className: styles.cinzel,
    note: "Velké titulky s viktoriánskou geometrií a kovovým charakterem.",
  },
  {
    id: "unifraktur",
    label: "UnifrakturCook",
    className: styles.unifraktur,
    note: "Historický blackletter styl vhodný pro emblem nebo pečeť.",
  },
  {
    id: "pirata",
    label: "Pirata One",
    className: styles.pirata,
    note: "Ručně kreslený retro feeling, který působí dobrodružně.",
  },
  {
    id: "rye",
    label: "Rye",
    className: styles.rye,
    note: "Divoký western-vintage mix s výrazným steampunk dojmem.",
  },
  {
    id: "special-elite",
    label: "Special Elite",
    className: styles.specialElite,
    note: "Písmo psacího stroje pro deníky výprav a technické poznámky.",
  },
];

export const metadata: Metadata = {
  title: "Test steampunk fontů | PRAHA 112",
  description: "Testovací stránka s pěti steampunk fonty.",
};

export default function TestPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120f0c] text-[#f7ecd6]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(205,146,52,0.22),transparent_46%),radial-gradient(circle_at_84%_80%,rgba(143,80,29,0.22),transparent_44%),linear-gradient(160deg,#120f0c_0%,#1b140f_52%,#0f0c0a_100%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.035)_0,rgba(255,255,255,0.035)_1px,transparent_1px,transparent_8px)] opacity-45" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-amber-100/10 to-transparent" />
      </div>

      <section className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-10 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
          Testovací laboratoř
        </p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-[#ffe8b6] sm:text-5xl">
          Steampunk fonty pro experiment
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-amber-50/80 sm:text-base">
          Níže je pět různých stylů. Každá karta ukazuje název fontu i
          ukázkový text, abychom mohli rychle porovnat charakter písma pro další
          návrhy.
        </p>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {fontPreviews.map((font) => (
            <article
              key={font.id}
              className="group rounded-2xl border border-amber-200/20 bg-[linear-gradient(175deg,rgba(255,224,165,0.14),rgba(89,56,25,0.09))] p-5 shadow-[0_8px_34px_rgba(0,0,0,0.36)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/70">
                {font.label}
              </p>
              <p
                className={`mt-3 text-3xl leading-tight text-[#fff0cf] sm:text-4xl ${font.className}`}
              >
                Praha 112
              </p>
              <p
                className={`mt-3 text-lg leading-relaxed text-amber-50/90 ${font.className}`}
              >
                Město mosazi, páry a tajných map.
              </p>
              <p className="mt-4 text-sm leading-6 text-amber-100/78">
                {font.note}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
