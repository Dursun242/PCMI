/**
 * Formulaire de la page /permis-express (campagne Google Ads).
 *
 * Tout ce qui sert à la fois au formulaire (navigateur) et à l'API (serveur)
 * vit ici : libellés des choix, lecture et contrôle de la demande, tri des
 * demandes urgentes. Aucune dépendance serveur : importable des deux côtés.
 */
import { express } from "@/config/site";

export type Choix = readonly (readonly [string, string])[];

export const TYPES_MAISON: Choix = [
  ["plain-pied", "Plain-pied"],
  ["etage", "Avec étage ou combles aménagés"],
  ["ne-sait-pas", "Je ne sais pas encore"],
];

export const SITUATIONS_TERRAIN: Choix = [
  ["compromis", "Compromis signé (condition suspensive de permis)"],
  ["achete", "Terrain déjà acheté"],
  ["recherche", "Terrain en vue, pas encore signé"],
];

export const ECHEANCES: Choix = [
  ["2-semaines", "Dans les 2 semaines"],
  ["1-mois", "Dans le mois"],
  ["3-mois", "Dans les 3 mois"],
  ["pas-urgent", "Pas de date imposée"],
];

export const RENDEZ_VOUS: Choix = [
  ["distance", "Tout à distance (téléphone, e-mail)"],
  ["bureau", "Rendez-vous au bureau du Havre"],
];

/** Échéances qui font passer la demande en tête de pile. */
const ECHEANCES_URGENTES = new Set(["2-semaines", "1-mois"]);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Identifiant de clic Google Ads : lettres, chiffres, tiret, soulignement. */
const GCLID = /^[A-Za-z0-9_-]{10,200}$/;

export interface DemandeExpress {
  name: string;
  phone: string;
  email: string;
  city: string;
  typeMaison: string;
  surface: number | null;
  terrain: string;
  echeance: string;
  rendezVous: string;
  message: string;
  gclid: string;
}

export type Lecture = { ok: true; demande: DemandeExpress } | { ok: false; error: string };

const texte = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Une valeur hors liste devient chaîne vide plutôt que d'être recopiée telle quelle. */
const parmi = (v: unknown, choix: Choix) => {
  const s = texte(v, 40);
  return choix.some(([valeur]) => valeur === s) ? s : "";
};

export function libelle(choix: Choix, valeur: string): string {
  return choix.find(([v]) => v === valeur)?.[1] ?? "Non précisé";
}

/** Lit et contrôle le corps envoyé par le formulaire. */
export function lireDemande(body: Record<string, unknown>): Lecture {
  const name = texte(body.name, 120);
  const phone = texte(body.phone, 40);
  const email = texte(body.email, 200);
  const city = texte(body.city, 120);

  if (!name || !city) return { ok: false, error: "Merci d'indiquer votre nom et la commune du terrain." };
  if (phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Merci d'indiquer un numéro de téléphone valide." };
  if (email && !EMAIL.test(email)) return { ok: false, error: "L'adresse e-mail semble incomplète." };
  if (!body.consent) return { ok: false, error: "Merci d'accepter le traitement de votre demande." };

  const n = Number(texte(body.surface, 10));
  const surface = Number.isFinite(n) && n > 0 && n <= 1000 ? Math.round(n) : null;
  const gclid = texte(body.gclid, 200);

  return {
    ok: true,
    demande: {
      name,
      phone,
      email,
      city,
      typeMaison: parmi(body.typeMaison, TYPES_MAISON),
      surface,
      terrain: parmi(body.terrain, SITUATIONS_TERRAIN),
      echeance: parmi(body.echeance, ECHEANCES),
      rendezVous: parmi(body.rendezVous, RENDEZ_VOUS),
      message: texte(body.message, 2000),
      gclid: GCLID.test(gclid) ? gclid : "",
    },
  };
}

/** Le projet entre-t-il dans la formule Express (plain-pied, surface plafonnée) ? */
export function eligibleExpress(d: Pick<DemandeExpress, "typeMaison" | "surface">): boolean {
  return d.typeMaison === "plain-pied" && d.surface !== null && d.surface <= express.surfaceMax;
}

/** À rappeler en priorité : date butoir proche, ou compromis en cours. */
export function estUrgente(d: Pick<DemandeExpress, "echeance" | "terrain">): boolean {
  return ECHEANCES_URGENTES.has(d.echeance) || d.terrain === "compromis";
}
