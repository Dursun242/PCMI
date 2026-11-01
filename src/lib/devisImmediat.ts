import { lancement, plans, type Plan, type PlanId } from "@/config/site";
import { SURFACE_MAX } from "@/lib/formulaFinder";

/** Seul type de projet couvert par les trois formules à prix fixe. */
export const PROJET_DEVIS_IMMEDIAT = "maison-neuve";

export interface DemandeDevis {
  /** Formule cochée dans le formulaire, ou « conseil ». */
  plan: string | undefined;
  surface: string | number | undefined;
  /** Valeur du champ « Type de projet ». */
  projet: string | undefined;
}

/**
 * Formule dont le prix fixe peut s'afficher dès l'envoi du formulaire de
 * devis, ou null quand une personne doit chiffrer : « Conseillez-moi »,
 * surface inconnue ou au-delà de SURFACE_MAX, projet autre qu'une maison neuve.
 *
 * Partagée par le formulaire, la page de confirmation et l'e-mail au client,
 * pour qu'ils ne puissent pas se contredire.
 */
export function formuleDevisImmediat({ plan, surface, projet }: DemandeDevis): PlanId | null {
  if (projet !== PROJET_DEVIS_IMMEDIAT) return null;
  const formule = plans.find((p) => p.id === plan);
  if (!formule) return null;
  if (surface === "" || surface === undefined) return null;
  // Arrondie comme dans le lien de commande : ce qui est affiché est ce qui est commandé.
  const m2 = Math.round(Number(surface));
  if (!Number.isFinite(m2) || m2 < 1 || m2 > SURFACE_MAX) return null;
  return formule.id;
}

/** « 2026-11-30 » → « 30 novembre 2026 ». */
function dateLongue(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

/**
 * Date limite du prix promotionnel, à afficher partout où ce prix est écrit
 * (page et e-mail) : un e-mail relu après la fin de l'offre ne doit pas en
 * promettre le prix. Null hors offre.
 */
export function mentionOffreLancement(plan: Pick<Plan, "regularPriceTTC">): string | null {
  if (!lancement.actif || !plan.regularPriceTTC) return null;
  return `${lancement.nom} : ce prix vaut pour toute commande passée au plus tard le ${dateLongue(lancement.fin)}.`;
}

/** Tunnel de commande pré-rempli avec la formule et la surface du devis. */
export function lienCommandeImmediate(plan: PlanId, surface: string | number): string {
  return `/commander?formule=${plan}&surface=${Math.round(Number(surface))}`;
}
