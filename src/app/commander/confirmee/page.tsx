import type { Metadata } from "next";
import Link from "next/link";
import { DELAI_RETRACTATION_JOURS } from "@/lib/commande";

/** Fin du tunnel : la commande est signée, le client sait ce qui se passe ensuite. */
export const metadata: Metadata = {
  title: "Commande confirmée",
  description: "Votre commande de permis de construire est signée.",
  robots: { index: false, follow: false },
};

const ensuite: [string, string][] = [
  ["Nous vérifions votre terrain", "Nous lisons le règlement d'urbanisme de votre commune pour confirmer que le permis peut être déposé."],
  ["Nous lançons votre dossier", "Nous vous confirmons le démarrage par e-mail. Si le permis n'est pas possible, nous annulons tout : rien n'est facturé ni prélevé."],
  ["Premier prélèvement", `Il n'intervient qu'après notre validation et la fin de votre délai de rétractation de ${DELAI_RETRACTATION_JOURS} jours.`],
];

export default function ConfirmeePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <p className="numeral text-3xl text-bronze">✓</p>
      <h1 className="display mt-4 text-5xl sm:text-6xl">Votre commande est signée.</h1>
      <p className="lead mt-6">
        Merci de votre confiance. Vous venez de recevoir par e-mail votre devis signé, les conditions générales de vente et
        le formulaire de rétractation.
      </p>

      <h2 className="display mt-14 text-3xl">Et maintenant ?</h2>
      <ol className="mt-6 grid gap-6">
        {ensuite.map(([titre, detail], i) => (
          <li key={titre} className="flex gap-5">
            <span className="numeral text-3xl text-bronze w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="display text-2xl leading-tight">{titre}</div>
              <div className="mt-1 text-ink-2 text-[0.95rem]">{detail}</div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-12"><Link href="/" className="btn btn-line">Retour à l&apos;accueil</Link></p>
    </div>
  );
}
