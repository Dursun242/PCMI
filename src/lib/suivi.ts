/**
 * Compteur de la page de campagne /permis-express.
 *
 * Chaque événement est un petit fichier vide dans Vercel Blob, dont le CHEMIN
 * porte toute l'information : suivi/express/<jour>/<type>/<source>/<id>.txt.
 * Compter revient à lister les chemins, sans lire un seul fichier ni stocker
 * la moindre donnée personnelle (ni IP, ni cookie, ni identifiant).
 *
 * Ce module ne contient que la logique pure (chemins, agrégats) : il est testé
 * et importable partout. L'accès au stockage est dans suiviStore.ts.
 */

export const PREFIXE_SUIVI = "suivi/express/";
/** Remises à zéro : suivi/express-zero/<instant en ms>.txt. Seule la plus récente compte. */
export const PREFIXE_ZERO = "suivi/express-zero/";

import { decoderBilan, encoderBilan, TRANCHES_TEMPS, type Bilan, type TrancheTemps } from "./bilan";
import { decoderSuite, encoderSuite, type Suite } from "./suite";

export { TRANCHES_TEMPS, trancheTemps, type TrancheTemps } from "./bilan";

export const TYPES_SUIVI = [
  "vue",
  "formulaire",
  "demande",
  "demande-urgente",
  "appel",
  "whatsapp",
  // Bilan de visite (bilan.ts), dont le détail suit l'identifiant dans le nom du fichier.
  "bilan",
  // Page vue ou contact pris ailleurs sur le site après la page Express (suite.ts).
  "suite",
  // Temps passé envoyé seul : premières mesures, avant le bilan. Encore lues, plus envoyées.
  ...TRANCHES_TEMPS.map(([t]) => t),
] as const;
export type TypeSuivi = (typeof TYPES_SUIVI)[number];

function estTranche(t: TypeSuivi): t is TrancheTemps {
  return t.startsWith("temps-");
}

/** « ads » : la visite vient d'une annonce Google (gclid ou utm_source=google). */
export type SourceSuivi = "ads" | "direct";

export interface Evenement {
  jour: string; // AAAA-MM-JJ, heure de Paris
  type: TypeSuivi;
  source: SourceSuivi;
  /** Instant de l'événement en ms (0 pour les premiers événements, enregistrés sans). */
  instant: number;
  /** Seulement pour le type « bilan ». */
  bilan?: Bilan;
  /** Seulement pour le type « suite ». */
  suite?: Suite;
}

export function estTypeSuivi(v: unknown): v is TypeSuivi {
  return typeof v === "string" && (TYPES_SUIVI as readonly string[]).includes(v);
}

/** Jour calendaire à Paris : une visite à 23 h 30 compte pour ce jour-là, pas le lendemain. */
export function jourParis(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

/** Le nom du fichier commence par l'instant : c'est ce qui permet la remise à zéro sans rien effacer. */
export function cheminEvenement(e: Evenement, id: string): string {
  const detail = e.bilan ? `_${encoderBilan(e.bilan)}` : e.suite ? `_${encoderSuite(e.suite)}` : "";
  return `${PREFIXE_SUIVI}${e.jour}/${e.type}/${e.source}/${e.instant}-${id}${detail}.txt`;
}

/** Relit un chemin ; null pour tout chemin qui n'a pas la forme attendue. */
export function lireChemin(chemin: string): Evenement | null {
  if (!chemin.startsWith(PREFIXE_SUIVI)) return null;
  const [jour, type, source, fichier = ""] = chemin.slice(PREFIXE_SUIVI.length).split("/");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour ?? "") || !estTypeSuivi(type)) return null;
  if (source !== "ads" && source !== "direct") return null;
  const instant = Number(/^(\d{12,14})-/.exec(fichier)?.[1] ?? 0);
  const code = /_(.+)\.txt$/.exec(fichier)?.[1] ?? "";
  if (type === "bilan") {
    const bilan = decoderBilan(code);
    return bilan ? { jour, type, source, instant, bilan } : null;
  }
  if (type === "suite") {
    const suite = decoderSuite(code);
    return suite ? { jour, type, source, instant, suite } : null;
  }
  return { jour, type, source, instant };
}

export function cheminZero(instant: number): string {
  return `${PREFIXE_ZERO}${instant}.txt`;
}

/** Instant de la dernière remise à zéro (0 s'il n'y en a jamais eu). */
export function derniereRemise(chemins: string[]): number {
  return chemins.reduce((max, c) => {
    const n = Number(/^suivi\/express-zero\/(\d+)\.txt$/.exec(c)?.[1] ?? 0);
    return n > max ? n : max;
  }, 0);
}

/** Ne garde que les événements postérieurs à la remise à zéro. */
export function depuisRemise(evenements: Evenement[], zero: number): Evenement[] {
  return zero ? evenements.filter((e) => e.instant > zero) : evenements;
}

export interface Compteurs {
  visites: number;
  visitesAds: number;
  formulaires: number;
  demandes: number;
  demandesUrgentes: number;
  appels: number;
  whatsapp: number;
  temps: Record<TrancheTemps, number>;
}

export const COMPTEURS_VIDES: Compteurs = {
  visites: 0,
  visitesAds: 0,
  formulaires: 0,
  demandes: 0,
  demandesUrgentes: 0,
  appels: 0,
  whatsapp: 0,
  temps: { "temps-10s": 0, "temps-30s": 0, "temps-1min": 0, "temps-3min": 0, "temps-plus": 0 },
};

function ajouter(c: Compteurs, e: Evenement): Compteurs {
  if (estTranche(e.type)) return { ...c, temps: { ...c.temps, [e.type]: c.temps[e.type] + 1 } };
  if (e.type === "bilan") {
    return e.bilan ? { ...c, temps: { ...c.temps, [e.bilan.temps]: c.temps[e.bilan.temps] + 1 } } : c;
  }
  switch (e.type) {
    case "vue":
      return { ...c, visites: c.visites + 1, visitesAds: c.visitesAds + (e.source === "ads" ? 1 : 0) };
    case "formulaire":
      return { ...c, formulaires: c.formulaires + 1 };
    case "demande":
      return { ...c, demandes: c.demandes + 1 };
    case "demande-urgente":
      return { ...c, demandes: c.demandes + 1, demandesUrgentes: c.demandesUrgentes + 1 };
    case "appel":
      return { ...c, appels: c.appels + 1 };
    case "whatsapp":
      return { ...c, whatsapp: c.whatsapp + 1 };
    case "suite":
      return c;
  }
}

/** Totaux des événements dont le jour est >= `depuis` (tout l'historique si absent). */
export function compter(evenements: Evenement[], depuis?: string): Compteurs {
  return evenements.filter((e) => !depuis || e.jour >= depuis).reduce(ajouter, COMPTEURS_VIDES);
}

/**
 * Contacts obtenus : demandes envoyées et clics sur Appeler. WhatsApp ouvert n'en
 * est pas un : le visiteur doit encore envoyer le message (et, sur ordinateur,
 * avoir WhatsApp connecté) ; il est compté à part.
 */
export function contacts(c: Compteurs): number {
  return c.demandes + c.appels;
}

/** Part des visites qui aboutissent à un contact, en pourcentage arrondi ; null sans visite. */
export function tauxContact(c: Compteurs): number | null {
  return c.visites ? Math.round((contacts(c) / c.visites) * 1000) / 10 : null;
}

/** Jour situé `n` jours avant `jour` (format AAAA-MM-JJ). */
export function joursAvant(jour: string, n: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Les `n` derniers jours, du plus récent au plus ancien, avec leurs compteurs (jours vides inclus). */
export function parJour(evenements: Evenement[], aujourdhui: string, n: number): { jour: string; compteurs: Compteurs }[] {
  return Array.from({ length: n }, (_, i) => {
    const jour = joursAvant(aujourdhui, i);
    return { jour, compteurs: compter(evenements.filter((e) => e.jour === jour)) };
  });
}
