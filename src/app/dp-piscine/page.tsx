import type { Metadata } from "next";
import DpPiscine from "@/components/dp/DpPiscine";
import { PRIX_DP_PISCINE_TTC } from "@/lib/dpPiscine";

// Page en essai : hors du menu, du plan du site et des moteurs de recherche tant que le parcours n'est pas validé.
export const metadata: Metadata = {
  title: "Déclaration préalable de piscine en ligne",
  description: "Faites vous-même la déclaration préalable de votre piscine : plans DP1, DP2, DP3 (DPC1 à DPC3) et Cerfa 16702 en 10 minutes.",
  robots: { index: false, follow: false },
};

const POINTS = [
  "Plan de situation (DP1 / DPC1)",
  "Plan de masse coté, distances aux limites (DP2 / DPC2)",
  "Plan en coupe sur le terrain (DP3 / DPC3)",
  "Cerfa 16702 pré-rempli",
  "Guide de dépôt en mairie",
];

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-16">
        <div>
          <span className="rule" aria-hidden="true" />
          <h1 className="display mt-7 text-5xl sm:text-6xl">La déclaration de votre piscine, faite en 10 minutes.</h1>
          <p className="lead mt-7 max-w-[60ch]">
            Trouvez votre terrain, placez votre bassin sur la vue aérienne : notre bureau d&apos;études dessine les plans et remplit
            le Cerfa. Vous voyez l&apos;aperçu gratuitement, et ne payez que s&apos;il vous convient.
          </p>
        </div>
        <aside className="self-end border-t border-ink pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">{PRIX_DP_PISCINE_TTC} € TTC, tout compris</p>
          <ul className="mt-4 grid gap-2.5 text-[0.95rem] leading-snug">
            {POINTS.map((m) => (
              <li key={m} className="flex gap-3"><span className="mt-2 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />{m}</li>
            ))}
          </ul>
        </aside>
      </div>
      <section className="mt-14 bg-stone px-5 py-8 sm:px-10 sm:py-12" aria-label="Préparer la déclaration préalable">
        <DpPiscine />
      </section>
    </div>
  );
}
