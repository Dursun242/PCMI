/**
 * Simulateur « permis de construire ou déclaration préalable ? ».
 *
 * Règles du code de l'urbanisme (art. R. 421-1 et suivants, R. 431-2) pour
 * les projets courants d'une maison individuelle. Le simulateur ne remplace
 * pas la lecture du PLU : il dit quelle autorisation le code exige, et
 * signale les cas où la réponse dépend d'une règle locale.
 */

export type Projet = "maison" | "annexe" | "extension" | "amenagement" | "piscine" | "facade" | "ravalement" | "cloture";
export type Zone = "urbaine" | "autre" | "inconnue";
export type Couverture = "aucune" | "basse" | "haute";
export type Verdict = "aucune" | "DP" | "PC";

export interface AutorisationSaisie {
  projet: Projet;
  /** Surface de plancher créée, en m². */
  surfacePlancher: number;
  /** Emprise au sol créée, en m². */
  emprise: number;
  /** Surface de plancher existante avant travaux (extension, aménagement). */
  surfaceExistante: number;
  /** Superficie du bassin (piscine). */
  bassin: number;
  zone: Zone;
  secteurProtege: boolean;
  couverture: Couverture;
  /** Les travaux modifient-ils l'aspect extérieur (façade, ouvertures, toiture) ? */
  modifieAspect: boolean;
}

export interface Resultat {
  verdict: Verdict;
  /** Pourquoi, en une ou deux phrases. */
  raison: string;
  /** Article du code de l'urbanisme qui fonde la réponse. */
  article: string;
  architecte: boolean;
  /** Ce qui changerait la réponse quand elle dépend d'une règle locale. */
  variante?: { condition: string; verdict: Verdict };
  /** Précautions à lire avant de déposer. */
  reserves: string[];
}

/** Seuils du code de l'urbanisme, en m² (et en mètres pour la couverture de piscine). */
export const SEUILS = {
  dispense: 5,
  declaration: 20,
  declarationZoneUrbaine: 40,
  architecte: 150,
  piscineDispense: 10,
  piscineDeclaration: 100,
  couvertureHaute: 1.8,
} as const;

export const LIBELLES_VERDICT: Record<Verdict, string> = {
  aucune: "Aucune autorisation",
  DP: "Déclaration préalable",
  PC: "Permis de construire",
};

/** Formulaire à remplir, pour une maison individuelle et ses annexes. */
export const CERFA: Record<Exclude<Verdict, "aucune">, string> = {
  DP: "CERFA n° 13703 (déclaration préalable pour une maison individuelle et ses annexes)",
  PC: "CERFA n° 13406 (permis de construire une maison individuelle et ses annexes)",
};

/** Délai d'instruction de droit commun ; un mois de plus quand l'Architecte des Bâtiments de France est consulté. */
export function delaiInstruction(verdict: Verdict, secteurProtege: boolean): string | null {
  if (verdict === "aucune") return null;
  const mois = (verdict === "DP" ? 1 : 2) + (secteurProtege ? 1 : 0);
  return `${mois} mois`;
}

const RESERVE_PLU = "Le PLU de la commune s'applique dans tous les cas (implantation, hauteur, aspect) : relisez-le avant de dessiner.";
const RESERVE_ABF = "En secteur protégé, l'Architecte des Bâtiments de France donne son avis, ce qui allonge l'instruction d'un mois.";

const valide = (n: number) => Number.isFinite(n) && n >= 0;

function reservesCommunes(s: AutorisationSaisie): string[] {
  return [RESERVE_PLU, ...(s.secteurProtege ? [RESERVE_ABF] : [])];
}

/** Construction nouvelle : maison ou annexe détachée (abri, garage, carport, pool-house). */
function constructionNouvelle(s: AutorisationSaisie): Resultat {
  const surface = Math.max(s.surfacePlancher, s.emprise);
  const maison = s.projet === "maison";
  const reserves = [
    ...(maison ? [] : ["Ces seuils valent pour une construction de 12 m de haut au plus."]),
    "Plusieurs petites constructions faites en même temps s'additionnent : la mairie juge le projet dans son ensemble.",
    ...reservesCommunes(s),
  ];
  const architecte = s.surfacePlancher > SEUILS.architecte;

  if (surface > SEUILS.declaration) {
    return {
      verdict: "PC",
      raison: `La construction crée ${fmt(surface)} m² de surface de plancher ou d'emprise au sol, au-delà de ${SEUILS.declaration} m².`,
      article: "Code de l'urbanisme, art. R. 421-1",
      architecte,
      reserves,
    };
  }
  if (s.secteurProtege) {
    return {
      verdict: "DP",
      raison: `En secteur protégé, toute construction nouvelle de ${SEUILS.declaration} m² ou moins demande une déclaration préalable, même sous ${SEUILS.dispense} m².`,
      article: "Code de l'urbanisme, art. R. 421-11",
      architecte: false,
      reserves,
    };
  }
  if (surface > SEUILS.dispense) {
    return {
      verdict: "DP",
      raison: `La construction crée entre ${SEUILS.dispense} et ${SEUILS.declaration} m² de surface de plancher ou d'emprise au sol.`,
      article: "Code de l'urbanisme, art. R. 421-9",
      architecte: false,
      reserves,
    };
  }
  return {
    verdict: "aucune",
    raison: `Une construction de ${SEUILS.dispense} m² ou moins, hors secteur protégé, est dispensée de formalité.`,
    article: "Code de l'urbanisme, art. R. 421-2",
    architecte: false,
    reserves,
  };
}

/** Travaux sur une maison existante qui créent de la surface : extension, véranda, surélévation, garage ou combles aménagés. */
function travauxExistant(s: AutorisationSaisie): Resultat {
  const creee = Math.max(s.surfacePlancher, s.emprise);
  const total = s.surfaceExistante + s.surfacePlancher;
  const depasse150 = total > SEUILS.architecte;
  const amenagement = s.projet === "amenagement";
  const reserves = [
    ...(amenagement
      ? ["Transformer un garage ou des combles en pièce de vie crée de la surface de plancher, même sans agrandir la maison."]
      : []),
    ...reservesCommunes(s),
  ];
  const seuilTotal = `la surface de plancher totale (${fmt(total)} m²) dépasse ${SEUILS.architecte} m²`;

  if (creee > SEUILS.declarationZoneUrbaine) {
    return {
      verdict: "PC",
      raison: `Les travaux créent ${fmt(creee)} m², au-delà de ${SEUILS.declarationZoneUrbaine} m².`,
      article: "Code de l'urbanisme, art. R. 421-14",
      architecte: depasse150,
      reserves,
    };
  }
  if (creee > SEUILS.declaration) {
    const enZoneU: Verdict = depasse150 ? "PC" : "DP";
    if (s.zone === "urbaine") {
      return {
        verdict: enZoneU,
        raison: depasse150
          ? `En zone urbaine, une extension de ${SEUILS.declaration} à ${SEUILS.declarationZoneUrbaine} m² relève d'une déclaration préalable, sauf quand ${seuilTotal} : il faut alors un permis.`
          : `En zone urbaine d'un PLU, une extension de ${SEUILS.declaration} à ${SEUILS.declarationZoneUrbaine} m² relève d'une déclaration préalable.`,
        article: "Code de l'urbanisme, art. R. 421-14 et R. 421-17",
        architecte: depasse150,
        reserves,
      };
    }
    return {
      verdict: "PC",
      raison: `Hors zone urbaine d'un PLU, des travaux qui créent plus de ${SEUILS.declaration} m² demandent un permis de construire.`,
      article: "Code de l'urbanisme, art. R. 421-14",
      architecte: depasse150,
      ...(s.zone === "inconnue" ? { variante: { condition: "si le terrain est en zone urbaine (U) du PLU", verdict: enZoneU } } : {}),
      reserves,
    };
  }
  if (creee > SEUILS.dispense) {
    return {
      verdict: "DP",
      raison: `Les travaux créent entre ${SEUILS.dispense} et ${SEUILS.declaration} m² : une déclaration préalable suffit, quelle que soit la surface totale de la maison.`,
      article: "Code de l'urbanisme, art. R. 421-17",
      architecte: false,
      reserves,
    };
  }
  if (s.modifieAspect || s.secteurProtege) {
    return {
      verdict: "DP",
      raison: s.modifieAspect
        ? "Les travaux créent peu de surface, mais modifient l'aspect extérieur de la maison : cela suffit à demander une déclaration préalable."
        : "En secteur protégé, les travaux qui touchent l'extérieur de la maison passent par une déclaration préalable.",
      article: "Code de l'urbanisme, art. R. 421-17",
      architecte: false,
      reserves,
    };
  }
  return {
    verdict: "aucune",
    raison: `Les travaux créent ${SEUILS.dispense} m² ou moins et ne modifient pas l'aspect extérieur.`,
    article: "Code de l'urbanisme, art. R. 421-13",
    architecte: false,
    reserves,
  };
}

function piscine(s: AutorisationSaisie): Resultat {
  const b = s.bassin;
  const reserves = [
    "Une piscine démontable installée moins de 3 mois par an est dispensée de formalité.",
    ...reservesCommunes(s),
  ];
  if (s.couverture === "haute") {
    return {
      verdict: "PC",
      raison: `Un abri de piscine de ${fmt(SEUILS.couvertureHaute)} m de haut ou plus impose un permis de construire, quelle que soit la taille du bassin.`,
      article: "Code de l'urbanisme, art. R. 421-1 et R. 421-9",
      architecte: false,
      reserves,
    };
  }
  if (b > SEUILS.piscineDeclaration) {
    return {
      verdict: "PC",
      raison: `Le bassin dépasse ${SEUILS.piscineDeclaration} m².`,
      article: "Code de l'urbanisme, art. R. 421-1",
      architecte: false,
      reserves,
    };
  }
  if (b > SEUILS.piscineDispense) {
    return {
      verdict: "DP",
      raison: `Un bassin de ${SEUILS.piscineDispense} à ${SEUILS.piscineDeclaration} m², non couvert ou couvert à moins de ${fmt(SEUILS.couvertureHaute)} m, relève d'une déclaration préalable.`,
      article: "Code de l'urbanisme, art. R. 421-9",
      architecte: false,
      reserves,
    };
  }
  if (s.secteurProtege) {
    return {
      verdict: "DP",
      raison: `En secteur protégé, même un bassin de ${SEUILS.piscineDispense} m² ou moins demande une déclaration préalable.`,
      article: "Code de l'urbanisme, art. R. 421-11",
      architecte: false,
      reserves,
    };
  }
  return {
    verdict: "aucune",
    raison: `Un bassin de ${SEUILS.piscineDispense} m² ou moins, hors secteur protégé, est dispensé de formalité.`,
    article: "Code de l'urbanisme, art. R. 421-2",
    architecte: false,
    reserves,
  };
}

function facade(s: AutorisationSaisie): Resultat {
  return {
    verdict: "DP",
    raison:
      "Changer l'aspect extérieur de la maison (créer ou agrandir une ouverture, poser un châssis de toit, changer les matériaux ou les couleurs de la toiture, des menuiseries ou de la façade) demande une déclaration préalable.",
    article: "Code de l'urbanisme, art. R. 421-17",
    architecte: false,
    reserves: ["Un remplacement strictement à l'identique (mêmes dimensions, matériaux et couleurs) ne demande aucune formalité.", ...reservesCommunes(s)],
  };
}

/** Ravalement et clôture : la règle dépend de la commune hors secteur protégé. */
function selonCommune(s: AutorisationSaisie, objet: "ravalement" | "cloture"): Resultat {
  const ravalement = objet === "ravalement";
  const article = ravalement ? "Code de l'urbanisme, art. R. 421-17-1" : "Code de l'urbanisme, art. R. 421-12";
  const reserves = [
    ravalement
      ? "Un ravalement qui change la couleur ou le matériau de la façade modifie l'aspect extérieur : déclaration préalable dans tous les cas."
      : "Les clôtures nécessaires à l'activité agricole ou forestière sont dispensées.",
    ...reservesCommunes(s),
  ];
  if (s.secteurProtege) {
    return {
      verdict: "DP",
      raison: ravalement
        ? "En secteur protégé, un ravalement de façade demande une déclaration préalable."
        : "En secteur protégé, l'édification d'une clôture demande une déclaration préalable.",
      article,
      architecte: false,
      reserves,
    };
  }
  return {
    verdict: "aucune",
    raison: ravalement
      ? "Hors secteur protégé, un ravalement à l'identique n'est soumis à déclaration que si la commune l'a décidé."
      : "Hors secteur protégé, une clôture n'est soumise à déclaration que si la commune ou le PLU l'a décidé.",
    article,
    architecte: false,
    variante: {
      condition: ravalement
        ? "si la commune a soumis les ravalements à déclaration (renseignez-vous en mairie)"
        : "si la commune ou le PLU a soumis les clôtures à déclaration (c'est fréquent)",
      verdict: "DP",
    },
    reserves,
  };
}

/** Réponse du simulateur, ou null si une surface utile est manquante ou invalide. */
export function determinerAutorisation(s: AutorisationSaisie): Resultat | null {
  switch (s.projet) {
    case "maison":
    case "annexe":
      if (!valide(s.surfacePlancher) || !valide(s.emprise)) return null;
      return constructionNouvelle(s);
    case "extension":
    case "amenagement":
      if (!valide(s.surfacePlancher) || !valide(s.emprise) || !valide(s.surfaceExistante)) return null;
      return travauxExistant(s);
    case "piscine":
      if (!valide(s.bassin)) return null;
      return piscine(s);
    case "facade":
      return facade(s);
    case "ravalement":
    case "cloture":
      return selonCommune(s, s.projet);
  }
}

/** Quelles surfaces demander pour chaque projet. */
export function champsUtiles(projet: Projet): { surfaces: boolean; existante: boolean; zone: boolean; bassin: boolean; aspect: boolean } {
  const existant = projet === "extension" || projet === "amenagement";
  return {
    surfaces: projet === "maison" || projet === "annexe" || existant,
    existante: existant,
    zone: existant,
    bassin: projet === "piscine",
    aspect: existant,
  };
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}
