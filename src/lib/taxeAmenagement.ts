/**
 * Calcul de la taxe d'aménagement (et de la taxe d'archéologie préventive)
 * d'une maison individuelle.
 *
 * Volontairement pure et sans dépendance React, comme formulaFinder : c'est
 * un montant que des particuliers vont reporter dans leur plan de
 * financement, il doit pouvoir être testé et relu sans lancer l'application.
 *
 * Valeurs 2026 relevées sur service-public.gouv.fr (fiche F23263, vérifiée le
 * 1er janvier 2026). À mettre à jour chaque 1er janvier : seul l'objet
 * TA_2026 change, et les tests rappellent l'exemple officiel.
 */

export const TA_2026 = {
  annee: 2026,
  /** Valeur forfaitaire par m² de surface taxable. */
  valeurM2: { horsIdf: 892, idf: 1_011 },
  /** Valeur forfaitaire par m² de bassin. */
  piscineM2: 251,
  /** Valeur par place de stationnement extérieure : minimum légal, jusqu'à 5 857 € sur délibération. */
  stationnementPlace: 2_928,
  stationnementPlaceMax: 5_857,
  /** Abattement de 50 % sur les 100 premiers m² d'une résidence principale et de ses annexes. */
  abattementSurface: 100,
  abattementTaux: 0.5,
  /** Toute construction de 5 m² ou moins est exonérée. */
  surfaceExoneree: 5,
  /** Taxe d'archéologie préventive : 0,40 % de la même base. */
  tauxArcheologie: 0.004,
  /** Jusqu'à ce montant, la taxe d'aménagement est demandée en une fois. */
  seuilPaiementUnique: 1_500,
  /** Bornes légales des taux, en %. */
  tauxMax: { communal: 20, departemental: 2.5, regional: 1 },
} as const;

export interface TaxeSaisie {
  /** Surface taxable de la maison et de ses annexes closes et couvertes (garage, cellier), en m². */
  surfaceTaxable: number;
  residencePrincipale: boolean;
  ileDeFrance: boolean;
  /** Taux en %, ex. 5 pour 5 %. */
  tauxCommunal: number;
  tauxDepartemental: number;
  /** Île-de-France seulement. */
  tauxRegional: number;
  /** Surface du bassin, en m². */
  piscineM2: number;
  placesStationnement: number;
  /** Travaux qui touchent le sous-sol (fondations) : le cas de presque toutes les maisons. */
  archeologie: boolean;
}

export interface Echeance {
  quand: string;
  montant: number;
}

export interface TaxeResultat {
  baseConstruction: number;
  baseAmenagements: number;
  base: number;
  partCommunale: number;
  partDepartementale: number;
  partRegionale: number;
  taxeAmenagement: number;
  archeologie: number;
  total: number;
  echeances: Echeance[];
}

const estDans = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;

function saisieValide(s: TaxeSaisie): boolean {
  const { tauxMax } = TA_2026;
  return (
    estDans(s.surfaceTaxable, 0, 10_000) &&
    estDans(s.tauxCommunal, 0, tauxMax.communal) &&
    estDans(s.tauxDepartemental, 0, tauxMax.departemental) &&
    estDans(s.tauxRegional, 0, tauxMax.regional) &&
    estDans(s.piscineM2, 0, 1_000) &&
    estDans(s.placesStationnement, 0, 100) &&
    Number.isInteger(s.placesStationnement)
  );
}

function baseConstruction(s: TaxeSaisie): number {
  if (s.surfaceTaxable <= TA_2026.surfaceExoneree) return 0;
  const valeur = s.ileDeFrance ? TA_2026.valeurM2.idf : TA_2026.valeurM2.horsIdf;
  if (!s.residencePrincipale) return s.surfaceTaxable * valeur;
  const abattue = Math.min(s.surfaceTaxable, TA_2026.abattementSurface);
  return abattue * valeur * (1 - TA_2026.abattementTaux) + (s.surfaceTaxable - abattue) * valeur;
}

function echeances(taxe: number): Echeance[] {
  if (taxe <= 0) return [];
  if (taxe <= TA_2026.seuilPaiementUnique) {
    return [{ quand: "En une fois, à partir de 90 jours après l'achèvement des travaux", montant: taxe }];
  }
  const premiere = Math.ceil(taxe / 2);
  return [
    { quand: "1re moitié, à partir de 90 jours après l'achèvement des travaux", montant: premiere },
    { quand: "2de moitié, 6 mois après la première demande", montant: taxe - premiere },
  ];
}

/**
 * Montants arrondis à l'euro. Renvoie `null` si une saisie sort des bornes
 * légales : le composant n'affiche alors aucun chiffre plutôt qu'un faux.
 */
export function calculerTaxe(s: TaxeSaisie): TaxeResultat | null {
  if (!saisieValide(s)) return null;

  const construction = baseConstruction(s);
  const amenagements = s.piscineM2 * TA_2026.piscineM2 + s.placesStationnement * TA_2026.stationnementPlace;
  const base = construction + amenagements;

  const partCommunale = Math.round((base * s.tauxCommunal) / 100);
  const partDepartementale = Math.round((base * s.tauxDepartemental) / 100);
  const partRegionale = s.ileDeFrance ? Math.round((base * s.tauxRegional) / 100) : 0;
  const taxeAmenagement = partCommunale + partDepartementale + partRegionale;
  const archeologie = s.archeologie ? Math.round(base * TA_2026.tauxArcheologie) : 0;

  return {
    baseConstruction: construction,
    baseAmenagements: amenagements,
    base,
    partCommunale,
    partDepartementale,
    partRegionale,
    taxeAmenagement,
    archeologie,
    total: taxeAmenagement + archeologie,
    echeances: echeances(taxeAmenagement),
  };
}
