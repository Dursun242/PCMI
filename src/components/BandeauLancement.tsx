import Link from "next/link";
import { lancement, plans } from "@/config/site";
import { formatEuro, formatFrDate } from "@/lib/format";

/**
 * Bandeau de l'offre en cours (nom dans `lancement.nom`), au-dessus de l'en-tête sur tout le site.
 * Disparaît de lui-même quand `lancement.actif` passe à false (src/config/site.ts).
 */
export default function BandeauLancement() {
  if (!lancement.actif) return null;
  const remises = plans.map((p) => (p.regularPriceTTC ?? p.priceTTC) - p.priceTTC);
  const jourMois = new Date(lancement.fin).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }).replace(" ", "\u00a0");
  const remiseUnique = remises.every((r) => r === remises[0]) ? remises[0] : null;
  return (
    <div className="bg-forest text-paper">
      <p className="mx-auto max-w-7xl px-5 sm:px-8 py-2 text-center text-[0.8rem] sm:text-sm leading-snug">
        <strong className="font-bold text-brass-2">{lancement.nom}</strong>
        {" · "}
        {/* Sur téléphone, la version courte tient sur deux lignes. */}
        <span className="sm:hidden">
          {remiseUnique ? `−${formatEuro(remiseUnique)} par formule` : "prix réduits"}, jusqu&apos;au {jourMois}.{" "}
        </span>
        <span className="hidden sm:inline">
          {remiseUnique ? `${formatEuro(remiseUnique)} de moins sur chaque formule` : "prix réduits sur chaque formule"}, pour toute commande passée au plus tard le{" "}
          {formatFrDate(lancement.fin)}.{" "}
        </span>
        <Link href="/tarifs" className="underline decoration-brass-2 underline-offset-4 hover:text-brass-2">
          Voir les prix
        </Link>
      </p>
    </div>
  );
}
