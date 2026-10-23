/**
 * Formulaire de la page /permis-express (campagne Google Ads).
 *
 * Tout ce qui sert à la fois au formulaire (navigateur) et à l'API (serveur)
 * vit ici : libellés des choix, lecture et contrôle de la demande, tri des
 * demandes urgentes. Aucune dépendance serveur : importable des deux côtés.
 */
import { express, site } from "@/config/site";

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

/**
 * Verdict pour l'e-mail : « hors » seulement quand une réponse donnée exclut
 * l'Express (étage, surface trop grande) ; une réponse manquante laisse le
 * projet « à vérifier » au rappel plutôt que de l'écarter.
 */
export function verdictExpress(d: Pick<DemandeExpress, "typeMaison" | "surface">): "eligible" | "hors" | "a-verifier" {
  if (d.typeMaison === "etage" || (d.surface !== null && d.surface > express.surfaceMax)) return "hors";
  return eligibleExpress(d) ? "eligible" : "a-verifier";
}

/** À rappeler en priorité : date butoir proche, ou compromis en cours. */
export function estUrgente(d: Pick<DemandeExpress, "echeance" | "terrain">): boolean {
  return ECHEANCES_URGENTES.has(d.echeance) || d.terrain === "compromis";
}

/**
 * Questions de la page. La clé sert au compteur (questions ouvertes) :
 * ne pas la changer, sous peine de perdre l'historique de la question.
 */
export const FAQ_EXPRESS: readonly { cle: string; question: string; reponse: string }[] = [
  {
    cle: "delai",
    question: "Mon compromis a une date limite de dépôt. Vous pouvez tenir\u00a0?",
    reponse: `C'est notre spécialité. Dites-nous la date dès le premier appel : le dossier est prêt en ${express.delai} une fois vos informations réunies, et nous vous remettons le récépissé de dépôt, la preuve à transmettre au notaire.`,
  },
  {
    cle: "etage",
    question: `Et si ma maison a un étage ou dépasse ${express.surfaceMax} m²\u00a0?`,
    reponse: "Nous faisons aussi ces permis, avec une autre formule. Vous le saurez au devis, avant tout engagement, avec un prix fixe.",
  },
  {
    cle: "mairie",
    question: "Combien de temps la mairie met-elle ensuite\u00a0?",
    reponse: "Deux mois d'instruction pour une maison individuelle, trois en secteur protégé. Un dossier complet dès le dépôt évite la demande de pièces qui relance ce délai.",
  },
  {
    cle: "deplacer",
    question: "Faut-il se déplacer\u00a0?",
    reponse: `Non : tout peut se faire par téléphone et e-mail. Si vous préférez en parler de vive voix, le bureau vous reçoit au ${site.address.street}, ${site.address.city}.`,
  },
  {
    cle: "preparer",
    question: "Que dois-je préparer\u00a0?",
    reponse: "Le plan du terrain (bornage ou extrait cadastral), votre idée de plan, même griffonnée, ou un plan de constructeur, et deux photos du terrain. Rien n'est nécessaire pour demander le devis.",
  },
];
