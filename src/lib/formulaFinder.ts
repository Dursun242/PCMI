/**
 * Logique du sélecteur « Quelle formule pour mon projet ? ».
 *
 * Volontairement pure et sans dépendance React : c'est la seule règle de
 * recommandation du site, elle doit pouvoir être testée et relue sans lancer
 * l'application. Elle ne fait que traduire ce que les formules contiennent
 * déjà (voir src/config/site.ts) — elle n'invente aucune promesse.
 */
import { plans, type PlanId } from "@/config/site";

/** Le terrain est-il soumis à des contraintes d'urbanisme particulières ? */
export type Contraintes = "oui" | "non" | "je-ne-sais-pas";

export interface Answers {
  /** Surface de plancher approximative, en m². */
  surface: number | null;
  /** PLU particulier, secteur protégé ou avis de l'Architecte des Bâtiments de France. */
  contraintes: Contraintes | null;
  /** Besoin de rendus 3D réalistes et de l'attestation RE2020. */
  rendus3dEtRe2020: boolean | null;
}

export interface Recommendation {
  /** `null` lorsque le projet sort des formules à prix fixe. */
  planId: PlanId | null;
  /** Nom affiché : celui de la formule, ou « Devis sur mesure ». */
  planName: string;
  /** Deux phrases de justification, tirées des réponses données. */
  rationale: string[];
  /** Lien de devis pré-rempli. */
  href: string;
}

/** Seuil des formules à prix fixe : au-delà, le permis est établi sur devis. */
export const SURFACE_MAX = 149;
/** Seuil légal de recours obligatoire à un architecte (code de l'urbanisme, art. L.431-3). */
export const SURFACE_ARCHITECTE = 150;

export function isComplete(a: Answers): boolean {
  return a.surface !== null && a.contraintes !== null && a.rendus3dEtRe2020 !== null;
}

function planName(id: PlanId) {
  return plans.find((p) => p.id === id)?.name ?? id;
}

function devisHref(planId: PlanId | null, surface: number | null) {
  const params = new URLSearchParams();
  if (planId) params.set("formule", planId);
  if (surface !== null) params.set("surface", String(surface));
  const qs = params.toString();
  return qs ? `/devis?${qs}` : "/devis";
}

/**
 * Recommande une formule à partir des trois réponses.
 * Renvoie `null` tant que le questionnaire est incomplet.
 */
export function recommend(a: Answers): Recommendation | null {
  if (!isComplete(a)) return null;

  const surface = a.surface as number;
  const contraintes = a.contraintes as Contraintes;
  const rendus = a.rendus3dEtRe2020 as boolean;

  // Hors formules : le prix ne peut pas être annoncé à l'avance.
  if (surface > SURFACE_MAX) {
    const rationale = [
      `Avec ${surface} m² de surface de plancher, votre projet dépasse la limite de ${SURFACE_MAX} m² des trois formules à prix fixe.`,
      surface >= SURFACE_ARCHITECTE
        ? `Au-delà de ${SURFACE_ARCHITECTE} m², le recours à un architecte est légalement obligatoire : nous montons le dossier avec notre architecte partenaire et vous adressons un devis sous 4 h ouvrées.`
        : "Nous chiffrons le dossier sur mesure et vous répondons sous 4 h ouvrées.",
    ];
    return { planId: null, planName: "Devis sur mesure", rationale, href: devisHref(null, surface) };
  }

  const contraint = contraintes === "oui";
  const incertain = contraintes === "je-ne-sais-pas";

  // Terrain contraint ET besoin de rendus : accompagnement sur mesure.
  if (contraint && rendus) {
    return {
      planId: "premium",
      planName: planName("premium"),
      rationale: [
        "Un terrain soumis à un PLU particulier ou à l'avis de l'Architecte des Bâtiments de France demande des arbitrages de conception, pas seulement un dossier à remplir.",
        "La formule Premium ajoute la conception des plans, trois rendus 3D, l'étude des eaux pluviales si le PLU l'exige et un point visio à chaque étape.",
      ],
      href: devisHref("premium", surface),
    };
  }

  if (contraint) {
    return {
      planId: "complet",
      planName: planName("complet"),
      rationale: [
        "Sur un terrain contraint, l'instruction donne souvent lieu à une demande de pièces complémentaires de la mairie.",
        "La formule Complet couvre le dépôt, les réponses à ces demandes et les modifications jusqu'à l'obtention du permis.",
      ],
      href: devisHref("complet", surface),
    };
  }

  if (incertain) {
    return {
      planId: "complet",
      planName: planName("complet"),
      rationale: [
        "Ne pas connaître les règles applicables à son terrain est le cas le plus fréquent : nous vérifions nous-mêmes le PLU de votre commune avant de dessiner.",
        "La formule Complet inclut le dépôt en mairie et le suivi jusqu'à l'accord, ce qui vous évite d'avoir à interpréter les demandes de l'administration.",
      ],
      href: devisHref("complet", surface),
    };
  }

  if (rendus) {
    return {
      planId: "complet",
      planName: planName("complet"),
      rationale: [
        "Les rendus 3D réalistes (PCMI 6) et l'attestation de prise en compte de la RE2020 sont inclus à partir de la formule Complet.",
        "Votre terrain ne présentant pas de contrainte d'urbanisme particulière, la conception sur mesure de la formule Premium n'est pas nécessaire.",
      ],
      href: devisHref("complet", surface),
    };
  }

  return {
    planId: "essentiel",
    planName: planName("essentiel"),
    rationale: [
      "Terrain sans contrainte particulière et pas de besoin de rendus 3D : le dossier PCMI 1 à 8 complet, prêt à déposer, suffit.",
      "Vous déposez vous-même en mairie ; si vous préférez nous confier le dépôt et le suivi, la formule Complet le prend en charge.",
    ],
    href: devisHref("essentiel", surface),
  };
}
