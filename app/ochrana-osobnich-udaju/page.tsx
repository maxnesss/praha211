import type { Metadata } from "next";
import Link from "next/link";
import metro from "@/app/metro-theme.module.css";

export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
  description:
    "Zásady ochrany osobních údajů a GDPR informace pro projekt PRAHA 112.",
  alternates: {
    canonical: "/ochrana-osobnich-udaju",
  },
  openGraph: {
    title: "Ochrana osobních údajů | PRAHA 112",
    description:
      "Informace o zpracování osobních údajů, cookies a vašich právech podle GDPR.",
    url: "/ochrana-osobnich-udaju",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className={metro.routeShell}>
      <div className={`${metro.scanlineOverlay} pointer-events-none absolute inset-0 opacity-35`} />
      <div className={`${metro.backdropGradient} pointer-events-none absolute inset-0`} />
      <div className={`${metro.gridOverlay} pointer-events-none absolute inset-0 opacity-50`} />

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl px-5 py-10 sm:px-10">
        <article className={`${metro.pageReveal} w-full rounded-3xl border border-cyan-300/35 bg-[#0c202e]/85 p-6 text-cyan-50 shadow-[0_24px_56px_rgba(0,0,0,0.48)] sm:p-8 ${metro.mobilePanel}`}>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/75">
            <Link href="/" className="hover:text-cyan-100">
              ← Zpět
            </Link>
            <span aria-hidden="true" className="text-cyan-200/45">/</span>
            <Link href="/radnice" className="hover:text-cyan-100">
              Do radnice
            </Link>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-cyan-200/75">
            PRAHA 112
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Ochrana osobních údajů (GDPR)
          </h1>
          <p className="mt-3 text-sm text-cyan-100/80 sm:text-base">
            Platnost dokumentu od 2. března 2026.
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-cyan-100/90 sm:text-base">
            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">1. Kdo údaje zpracovává</h2>
              <p className="mt-2">
                Správcem je provozovatel projektu PRAHA 112. Pro všechny žádosti ke
                zpracování osobních údajů použijte formulář na stránce{" "}
                <Link href="/kontaktujte-nas" className="text-cyan-100 underline underline-offset-4 hover:text-cyan-50">
                  Kontaktujte nás
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">2. Jaké údaje zpracováváme</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Účet: e-mail, volitelné jméno, přezdívka, avatar, role, čas registrace.</li>
                <li>Herní data: potvrzené městské části, body, čas claimů, týmové členství.</li>
                <li>Selfie důkazy: technický klíč souboru v privátním úložišti (Cloudflare R2).</li>
                <li>Kontakt: jméno, e-mail, téma a obsah zprávy odeslané přes formulář.</li>
                <li>Technická data: nezbytné cookies (přihlášení, bezpečnost, nastavení cookies).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">3. Účely a právní základy</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Provoz uživatelského účtu a herních funkcí: plnění smlouvy.</li>
                <li>Bezpečnost aplikace, prevence zneužití a audit: oprávněný zájem správce.</li>
                <li>Volitelná analytika cookies: souhlas udělený v cookie dialogu.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">4. Jak dlouho údaje uchováváme</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Účet a herní data po dobu existence účtu, nebo do žádosti o výmaz.</li>
                <li>Technické logy a bezpečnostní záznamy pouze po nezbytně nutnou dobu.</li>
                <li>Nastavení cookies podle zvoleného režimu a doby platnosti cookies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">5. Komu mohou být údaje zpřístupněny</h2>
              <p className="mt-2">
                Údaje zpracovávají pouze služby nutné k provozu aplikace (hosting, databáze,
                privátní objektové úložiště, autentizace). Údaje neprodáváme.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">6. Vaše práva podle GDPR</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Právo na přístup k údajům a jejich opravu.</li>
                <li>Právo na výmaz, omezení zpracování a přenositelnost.</li>
                <li>Právo vznést námitku proti zpracování.</li>
                <li>Právo odvolat souhlas (u volitelné analytiky cookies).</li>
                <li>Právo podat stížnost u Úřadu pro ochranu osobních údajů.</li>
              </ul>
              <p className="mt-2">
                Pro uplatnění práv použijte{" "}
                <Link href="/kontaktujte-nas" className="text-cyan-100 underline underline-offset-4 hover:text-cyan-50">
                  kontaktní formulář
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-cyan-50 sm:text-xl">7. Cookies</h2>
              <p className="mt-2">
                Při první návštěvě si můžete vybrat mezi režimem „Pouze nezbytné“ a
                „Povolit analytiku“. Volbu lze kdykoliv změnit vymazáním cookies v prohlížeči
                a opětovným nastavením při další návštěvě.
              </p>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
