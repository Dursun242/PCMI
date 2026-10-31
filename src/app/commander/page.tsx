import type { Metadata } from "next";
import CommandeTunnel from "@/components/commande/CommandeTunnel";

/**
 * Commande en ligne avec règlement par prélèvement SEPA (1, 4 ou 10 fois).
 *
 * Hors index et hors sitemap, comme toute page de tunnel : on y arrive par
 * les boutons « Commander » du site (?formule= et ?surface= pré-remplissent
 * le panier et les coordonnées).
 */
export const metadata: Metadata = {
  title: "Commander votre permis de construire",
  description: "Choisissez votre formule, renseignez votre terrain et réglez en 1, 4 ou 10 fois par prélèvement SEPA.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/commander" },
};

export const dynamic = "force-dynamic";

export default async function CommanderPage({
  searchParams,
}: {
  searchParams: Promise<{ formule?: string; surface?: string }>;
}) {
  const { formule, surface } = await searchParams;
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-24">
      <span className="rule" aria-hidden="true" />
      <h1 className="display mt-7 text-5xl sm:text-6xl">Commander votre permis.</h1>
      <p className="lead mt-6 max-w-[56ch]">
        Rien n&apos;est prélevé avant que nous ayons vérifié que votre terrain permet le dépôt du permis.
      </p>
      <div className="mt-14">
        <CommandeTunnel presetFormule={formule} presetSurface={surface} />
      </div>
    </div>
  );
}
