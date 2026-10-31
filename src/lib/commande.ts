import { express, options, plans, type PlanId } from "@/config/site";
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

/** Racine du tunnel de commande : en-tête et pied de page y sont réduits au strict nécessaire. */
const RACINE_TUNNEL = "/commander";

export function estTunnelCommande(pathname: string): boolean {
  return pathname === RACINE_TUNNEL || pathname.startsWith(`${RACINE_TUNNEL}/`);
}

/**
 * Durée de validité d'une commande en cours (jeton signé, devis Qonto) : au-delà,
 * le client recommence sa commande.
 */
export const SIGNATURE = {
  validiteJours: 7,
} as const;

export type FormuleCommandeId = PlanId | "express";

export interface FormuleCommande {
  id: FormuleCommandeId;
  name: string;
  priceTTC: number;
  /** Prix habituel barré pendant une offre (formules à prix de lancement). */
  regularPriceTTC?: number;
  promise: string;
  delai: string;
  highlight?: boolean;
  /** Surface de plancher maximale acceptée, en m². */
  surfaceMax: number;
  /** Départements où la formule est proposée (codes) ; absent : partout. */
  departements?: readonly string[];
}

/** Codes des départements de l'Express, nommés en toutes lettres dans site.ts. */
export const CODES_DEPARTEMENTS_EXPRESS: Record<string, string> = {
  "Seine-Maritime": "76",
  Eure: "27",
  Calvados: "14",
  Manche: "50",
  Orne: "61",
  Somme: "80",
};

/**
 * Formules vendues en ligne : l'Express (tant que l'offre est active, limitée
 * à ses départements), puis les trois formules aux prix en vigueur.
 */
export const formulesCommande: FormuleCommande[] = [
  ...(express.actif
    ? [
        {
          id: "express" as const,
          name: express.nom,
          priceTTC: express.prixTTC,
          promise: `Le dossier complet, déposé en ligne. ${express.departements.join(", ")} uniquement.`,
          delai: express.delai,
          surfaceMax: express.surfaceMax,
          departements: express.departements.map((d) => CODES_DEPARTEMENTS_EXPRESS[d]).filter(Boolean),
        },
      ]
    : []),
  ...plans.map((p) => ({
    id: p.id,
    name: p.name,
    priceTTC: p.priceTTC,
    regularPriceTTC: p.regularPriceTTC,
    promise: p.promise,
    delai: p.delayWorkingDays,
    highlight: p.highlight,
    surfaceMax: SURFACE_MAX,
  })),
];

export type OptionCommandeId = "rendu-3d" | "attestation-re2020" | "eaux-pluviales";

export interface OptionCommande {
  id: OptionCommandeId;
  name: string;
  priceTTC: number;
  note: string;
  quantiteMax: number;
  /** Formules auxquelles l'option peut s'ajouter : ailleurs, elle est déjà incluse. */
  formules: readonly FormuleCommandeId[];
}

/**
 * Options vendables dans le panier. Le permis modificatif et la déclaration
 * préalable restent hors commande en ligne : ce sont des prestations à part,
 * pas des compléments du permis.
 */
const reglesOptions: Record<OptionCommandeId, Pick<OptionCommande, "quantiteMax" | "formules">> = {
  "rendu-3d": { quantiteMax: 5, formules: ["express", "essentiel", "complet", "premium"] },
  "attestation-re2020": { quantiteMax: 1, formules: ["express", "essentiel"] },
  "eaux-pluviales": { quantiteMax: 1, formules: ["express", "essentiel", "complet"] },
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
  formule: FormuleCommandeId;
  lignes: LignePanier[];
  totalTTC: number;
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Recalcule le panier depuis la configuration ; null si la sélection est invalide. */
export function calculerPanier(selection: unknown): Panier | null {
  if (!estObjet(selection)) return null;
  const plan = formulesCommande.find((f) => f.id === selection.formule);
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
  /** Surface de plancher en m², limitée par la formule choisie. */
  surface: number;
  referenceCadastrale: string;
}

export type ResultatCoordonnees = { ok: true; coordonnees: Coordonnees } | { ok: false; erreur: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_POSTAL = /^\d{5}$/;
const CHIFFRES_TELEPHONE_MIN = 10;

const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Vérifie et nettoie les coordonnées du client et du terrain. */
export function validerCoordonnees(input: unknown, surfaceMax: number = SURFACE_MAX): ResultatCoordonnees {
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
  if (c.surface > surfaceMax) {
    return {
      ok: false,
      erreur: `Cette formule s'applique jusqu'à ${surfaceMax} m². Au-delà, demandez un devis sur mesure.`,
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

  const formule = formulesCommande.find((f) => f.id === panier.formule);
  const coordonnees = validerCoordonnees(input.coordonnees, formule?.surfaceMax);
  if (!coordonnees.ok) return coordonnees;
  if (formule?.departements && !formule.departements.includes(coordonnees.coordonnees.terrainCodePostal.slice(0, 2))) {
    return {
      ok: false,
      erreur: `La formule ${formule.name} est réservée aux terrains situés en ${express.departements.join(", ")}. Choisissez une autre formule dans votre panier.`,
    };
  }

  const choix = echeancier(panier.totalTTC, input.echeances);
  if (!choix) return { ok: false, erreur: "Nombre d'échéances non proposé pour ce montant." };

  return { ok: true, commande: { panier, coordonnees: coordonnees.coordonnees, echeancier: choix } };
}

/** Délai légal de rétractation (code de la consommation, art. L221-18), en jours calendaires. */
export const DELAI_RETRACTATION_JOURS = 14;

/**
 * Phrase de facturation reprise au règlement, sur le devis, la page de
 * signature et dans les e-mails : une seule facture, réglée par un
 * échéancier de prélèvements sur le mandat signé.
 */
export function mentionFacturation(e: Echeancier): string {
  const total = `${formatCentimes(e.montantCentimes * e.nombre)} TTC`;
  const reglement =
    e.nombre === 1 ? "réglée par un prélèvement SEPA" : `réglée en ${e.nombre} prélèvements SEPA mensuels de ${formatCentimes(e.montantCentimes)}`;
  return `Prix facturé en une facture de ${total}, ${reglement}. La facture est émise après validation de votre projet et la fin du délai de rétractation de ${DELAI_RETRACTATION_JOURS} jours.`;
}

const ajouterJours = (jour: string, n: number) => {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * Premier jour où le premier prélèvement peut avoir lieu : le délai de
 * rétractation ne compte pas le jour de la signature et expire à la fin du
 * 14e jour, d'où le 15e jour. Dates au format AAAA-MM-JJ.
 */
export function premierPrelevementAuPlusTot(jourSignature: string): string {
  return ajouterJours(jourSignature, DELAI_RETRACTATION_JOURS + 1);
}

/** Même jour du mois, `n` mois plus tard, ramené au dernier jour si le mois est plus court. */
function ajouterMois(jour: string, n: number): string {
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  const dernierJour = new Date(Date.UTC(annee, mois - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(annee, mois - 1 + n, Math.min(quantieme, dernierJour))).toISOString().slice(0, 10);
}

export interface Prelevement {
  numero: number;
  /** Date au plus tôt (AAAA-MM-JJ) : l'échéancier démarre après la validation du projet. */
  jour: string;
  montantCentimes: number;
}

/** Échéancier prévisionnel affiché au client : un prélèvement par mois à partir du premier possible. */
export function echeancierPrevisionnel(e: Echeancier, jourSignature: string): Prelevement[] {
  const premier = premierPrelevementAuPlusTot(jourSignature);
  return Array.from({ length: e.nombre }, (_, i) => ({ numero: i + 1, jour: ajouterMois(premier, i), montantCentimes: e.montantCentimes }));
}

const jourFr = (iso: string) => iso.split("-").reverse().join("/");

/**
 * Fiche à recopier dans Qonto pour lancer la facturation d'une commande
 * signée : une facture unique, puis l'échéancier de prélèvements.
 */
export function ficheFacturation(commande: Commande, jourSignature: string, numeroDevis?: string): [string, string][] {
  const { coordonnees, echeancier, panier } = commande;
  const formule = formulesCommande.find((f) => f.id === panier.formule)?.name ?? panier.formule;
  const options = panier.lignes.slice(1).map((l) => (l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle));
  const montant = `${formatCentimes(echeancier.montantCentimes)} TTC`;
  return [
    ["Client", `${coordonnees.prenom} ${coordonnees.nom}`],
    ["Facture", `Facture unique de ${formatCentimes(panier.totalTTC * 100)} TTC`],
    ["Échéancier", echeancier.nombre === 1 ? `1 prélèvement de ${montant}` : `${echeancier.nombre} prélèvements mensuels de ${montant}`],
    ["1er prélèvement au plus tôt", jourFr(premierPrelevementAuPlusTot(jourSignature))],
    ["Règlement", "Prélèvement SEPA, mandat déjà signé par le client"],
    ["Libellé", `Permis de construire, formule ${formule}${options.map((o) => ` + ${o}`).join("")}${numeroDevis ? `, devis ${numeroDevis}` : ""}`],
  ];
}
