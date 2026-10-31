import { options, plans, type PlanId } from "@/config/site";
import { SURFACE_MAX } from "@/lib/formulaFinder";

/**
 * Commande en ligne : panier, échéancier de prélèvement et coordonnées.
 *
 * Tout est recalculé ici, côté serveur, à partir de src/config/site.ts : le
 * navigateur n'envoie que des choix (formule, options, nombre d'échéances),
 * jamais un prix.
 */

/**
 * Nombres d'échéances proposés au client. Chaque échéance doit tomber juste
 * au centime : la facture récurrente Qonto refacture le même montant chaque
 * mois. Un nombre qui ne divise pas le total est simplement masqué.
 */
export const NOMBRES_ECHEANCES = [1, 4, 10] as const;
export type NombreEcheances = (typeof NOMBRES_ECHEANCES)[number];

export type OptionCommandeId = "rendu-3d" | "attestation-re2020" | "eaux-pluviales";

export interface OptionCommande {
  id: OptionCommandeId;
  name: string;
  priceTTC: number;
  note: string;
  quantiteMax: number;
  /** Formules auxquelles l'option peut s'ajouter : ailleurs, elle est déjà incluse. */
  formules: readonly PlanId[];
}

/**
 * Options vendables dans le panier. Le permis modificatif et la déclaration
 * préalable restent hors commande en ligne : ce sont des prestations à part,
 * pas des compléments du permis.
 */
const reglesOptions: Record<OptionCommandeId, Pick<OptionCommande, "quantiteMax" | "formules">> = {
  "rendu-3d": { quantiteMax: 5, formules: ["essentiel", "complet", "premium"] },
  "attestation-re2020": { quantiteMax: 1, formules: ["essentiel"] },
  "eaux-pluviales": { quantiteMax: 1, formules: ["essentiel", "complet"] },
};

export const optionsCommande: OptionCommande[] = options
  .filter((o): o is (typeof options)[number] & { id: OptionCommandeId } => o.id in reglesOptions)
  .map((o) => ({ id: o.id, name: o.name, priceTTC: o.priceTTC, note: o.note, ...reglesOptions[o.id] }));

export interface LignePanier {
  libelle: string;
  quantite: number;
  prixUnitaireTTC: number;
  totalTTC: number;
}

export interface Panier {
  formule: PlanId;
  lignes: LignePanier[];
  totalTTC: number;
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Recalcule le panier depuis la configuration ; null si la sélection est invalide. */
export function calculerPanier(selection: unknown): Panier | null {
  if (!estObjet(selection)) return null;
  const plan = plans.find((p) => p.id === selection.formule);
  if (!plan) return null;

  const choix = estObjet(selection.options) ? selection.options : {};
  const lignes: LignePanier[] = [{ libelle: `Formule ${plan.name}`, quantite: 1, prixUnitaireTTC: plan.priceTTC, totalTTC: plan.priceTTC }];

  for (const [id, quantite] of Object.entries(choix)) {
    const opt = optionsCommande.find((o) => o.id === id);
    if (!opt || typeof quantite !== "number" || !Number.isInteger(quantite)) return null;
    if (quantite < 0 || quantite > opt.quantiteMax) return null;
    if (quantite === 0) continue;
    if (!opt.formules.includes(plan.id)) return null;
    lignes.push({ libelle: opt.name, quantite, prixUnitaireTTC: opt.priceTTC, totalTTC: opt.priceTTC * quantite });
  }

  return { formule: plan.id, lignes, totalTTC: lignes.reduce((s, l) => s + l.totalTTC, 0) };
}

export interface Echeancier {
  nombre: NombreEcheances;
  montantCentimes: number;
}

/** Échéanciers proposés pour un total TTC en euros : seulement ceux qui tombent juste au centime. */
export function echeanciersPossibles(totalTTC: number): Echeancier[] {
  const centimes = Math.round(totalTTC * 100);
  return NOMBRES_ECHEANCES.filter((n) => centimes % n === 0).map((n) => ({ nombre: n, montantCentimes: centimes / n }));
}

/** Échéancier choisi par le client, s'il fait partie de ceux proposés pour ce total. */
export function echeancier(totalTTC: number, nombre: unknown): Echeancier | null {
  return echeanciersPossibles(totalTTC).find((e) => e.nombre === nombre) ?? null;
}

/** Montant en centimes au format français, décimales seulement si nécessaire. Ex. "497,50 €", "199 €". */
export function formatCentimes(centimes: number): string {
  const decimales = centimes % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(centimes / 100);
}

export interface Coordonnees {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  terrainAdresse: string;
  terrainCodePostal: string;
  terrainCommune: string;
  /** Surface de plancher en m², limitée aux formules (SURFACE_MAX). */
  surface: number;
  referenceCadastrale: string;
}

export type ResultatCoordonnees = { ok: true; coordonnees: Coordonnees } | { ok: false; erreur: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_POSTAL = /^\d{5}$/;
const CHIFFRES_TELEPHONE_MIN = 10;

const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Vérifie et nettoie les coordonnées du client et du terrain. */
export function validerCoordonnees(input: unknown): ResultatCoordonnees {
  if (!estObjet(input)) return { ok: false, erreur: "Formulaire illisible." };

  const c: Coordonnees = {
    prenom: texte(input.prenom, 80),
    nom: texte(input.nom, 80),
    email: texte(input.email, 200),
    telephone: texte(input.telephone, 40),
    adresse: texte(input.adresse, 200),
    codePostal: texte(input.codePostal, 5),
    ville: texte(input.ville, 120),
    terrainAdresse: texte(input.terrainAdresse, 200),
    terrainCodePostal: texte(input.terrainCodePostal, 5),
    terrainCommune: texte(input.terrainCommune, 120),
    surface: Number(texte(input.surface, 6)),
    referenceCadastrale: texte(input.referenceCadastrale, 60),
  };

  if (!c.prenom || !c.nom || !c.adresse || !c.ville) {
    return { ok: false, erreur: "Merci de renseigner vos prénom, nom et adresse." };
  }
  if (!EMAIL.test(c.email)) return { ok: false, erreur: "Adresse e-mail invalide." };
  if (c.telephone.replace(/\D/g, "").length < CHIFFRES_TELEPHONE_MIN) {
    return { ok: false, erreur: "Numéro de téléphone invalide." };
  }
  if (!CODE_POSTAL.test(c.codePostal)) return { ok: false, erreur: "Code postal invalide." };
  if (!c.terrainAdresse || !c.terrainCommune || !CODE_POSTAL.test(c.terrainCodePostal)) {
    return { ok: false, erreur: "Merci de renseigner l'adresse complète du terrain." };
  }
  if (!Number.isFinite(c.surface) || c.surface <= 0) {
    return { ok: false, erreur: "Merci d'indiquer la surface de plancher prévue." };
  }
  if (c.surface > SURFACE_MAX) {
    return {
      ok: false,
      erreur: `Les formules s'appliquent jusqu'à ${SURFACE_MAX} m². Au-delà, demandez un devis sur mesure.`,
    };
  }
  return { ok: true, coordonnees: c };
}

export interface Commande {
  panier: Panier;
  coordonnees: Coordonnees;
  echeancier: Echeancier;
}

export type ResultatCommande = { ok: true; commande: Commande } | { ok: false; erreur: string };

/** Vérifie une commande reçue du navigateur : panier, coordonnées et échéancier, tout recalculé. */
export function validerCommande(input: unknown): ResultatCommande {
  if (!estObjet(input)) return { ok: false, erreur: "Commande illisible." };

  const panier = calculerPanier(input.panier);
  if (!panier) return { ok: false, erreur: "Panier invalide. Rechargez la page et recommencez." };

  const coordonnees = validerCoordonnees(input.coordonnees);
  if (!coordonnees.ok) return coordonnees;

  const choix = echeancier(panier.totalTTC, input.echeances);
  if (!choix) return { ok: false, erreur: "Nombre d'échéances non proposé pour ce montant." };

  return { ok: true, commande: { panier, coordonnees: coordonnees.coordonnees, echeancier: choix } };
}
