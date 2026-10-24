/**
 * Bilan d'une visite de /permis-express : envoyé une seule fois, au départ du
 * visiteur, il résume ce qu'il a fait sur la page (temps passé, appareil,
 * sections vues, questions ouvertes, boutons touchés, dernier champ du
 * formulaire abandonné). Un seul fichier par visite, au lieu d'un par geste :
 * c'est ce qui garde le compteur sobre en opérations de stockage.
 *
 * Comme pour les autres événements (suivi.ts), tout tient dans le nom du
 * fichier et rien n'identifie le visiteur. Module pur, importable partout.
 */
import { FAQ_EXPRESS } from "./express";
import { classer, estClePage } from "./suite";

/** Temps passé, par tranche (bornes hautes en secondes). Seul compte le temps où la page est à l'écran. */
export const TRANCHES_TEMPS = [
  ["temps-10s", 10, "Moins de 10 s"],
  ["temps-30s", 30, "10 à 30 s"],
  ["temps-1min", 60, "30 s à 1 min"],
  ["temps-3min", 180, "1 à 3 min"],
  ["temps-plus", Infinity, "Plus de 3 min"],
] as const;
export type TrancheTemps = (typeof TRANCHES_TEMPS)[number][0];

export const APPAREILS = [
  ["telephone", "Téléphone"],
  ["tablette", "Tablette"],
  ["ordinateur", "Ordinateur"],
] as const;
export type Appareil = (typeof APPAREILS)[number][0];

/**
 * Sections de la page, dans leur ordre d'apparition sur téléphone (attribut
 * data-section). Sur ordinateur, réalisations et formulaire sont côte à côte.
 * L'ordre ne sert qu'à l'affichage : les clés, elles, ne doivent pas changer.
 */
export const SECTIONS = [
  ["maisons", "Nos réalisations (photos)"],
  ["formulaire", "Formulaire de devis"],
  ["deroule", "Déroulé en 3 étapes"],
  ["compris", "Compris et conditions"],
  ["questions", "Questions"],
  ["fin", "Bas de page"],
] as const;
export type Section = (typeof SECTIONS)[number][0];

/** Emplacements des boutons (attribut data-zone), dans l'ordre de la page, et ce qu'on peut y toucher. */
export const ZONES = [
  ["entete", "Menu du site"],
  ["hero", "Haut de page"],
  ["relance1", "Encadré après le déroulé"],
  ["relance2", "Encadré après les conditions"],
  ["bureau", "Adresse du bureau"],
  ["bas", "Bas de page"],
  ["pied", "Pied de page du site"],
  ["barre", "Barre en bas du téléphone"],
] as const;
export const ACTIONS = [
  ["appel", "Appeler"],
  ["devis", "Mon devis"],
  ["whatsapp", "WhatsApp"],
] as const;
export type Clic = `${(typeof ZONES)[number][0]}-${(typeof ACTIONS)[number][0]}`;
const CLICS = ZONES.flatMap(([z]) => ACTIONS.map(([a]) => `${z}-${a}`)) as Clic[];

/** D'où part un visiteur qui quitte la page vers une autre page du site. */
export const ZONES_SORTIE = [
  ["entete", "Menu du site"],
  ["pied", "Pied de page du site"],
  ["page", "Lien dans la page"],
] as const;
export type ZoneSortie = (typeof ZONES_SORTIE)[number][0];

/** Champs du formulaire (attribut name), pour le dernier touché avant un abandon. */
export const CHAMPS = [
  ["name", "Nom"],
  ["phone", "Téléphone"],
  ["city", "Commune"],
  ["echeance", "Échéance du dépôt"],
  ["typeMaison", "Type de maison"],
  ["surface", "Surface"],
  ["terrain", "Terrain"],
  ["rendezVous", "Rendez-vous"],
  ["email", "E-mail"],
  ["message", "Message"],
  ["consent", "Case d'accord"],
] as const;
export type Champ = (typeof CHAMPS)[number][0];

export interface Bilan {
  temps: TrancheTemps;
  appareil: Appareil;
  sections: Section[];
  /** Clés de FAQ_EXPRESS ouvertes. */
  faq: string[];
  clics: Clic[];
  /** Dernier champ touché, quand le formulaire a été commencé sans être envoyé. */
  abandon: Champ | null;
  envoye: boolean;
  /** Lien touché pour aller ailleurs sur le site (clé de page, voir suite.ts). */
  sortie: { zone: ZoneSortie; page: string } | null;
}

const cles = <T extends string>(liste: readonly (readonly [T, ...unknown[]])[]) => liste.map(([c]) => c);
const VALEURS = {
  temps: cles(TRANCHES_TEMPS),
  appareil: cles(APPAREILS),
  sections: cles(SECTIONS),
  faq: FAQ_EXPRESS.map((q) => q.cle),
  clics: CLICS,
  champs: cles(CHAMPS),
  zonesSortie: cles(ZONES_SORTIE),
};

export function trancheTemps(ms: number): TrancheTemps {
  return TRANCHES_TEMPS.find(([, max]) => ms < max * 1000)?.[0] ?? "temps-plus";
}

/** Valeurs connues seulement, sans doublon, dans l'ordre reçu. */
function parmi<T extends string>(valeurs: unknown, permises: readonly T[]): T[] {
  if (!Array.isArray(valeurs)) return [];
  return [...new Set(valeurs.filter((v): v is T => typeof v === "string" && (permises as readonly string[]).includes(v)))];
}

const un = <T extends string>(v: unknown, permises: readonly T[]): T | null => parmi([v], permises)[0] ?? null;

function lireSortie(v: unknown): Bilan["sortie"] {
  if (typeof v !== "object" || v === null) return null;
  const { zone, page } = v as Record<string, unknown>;
  const z = un(zone, VALEURS.zonesSortie);
  return z && estClePage(page) ? { zone: z, page } : null;
}

/** Contrôle le bilan reçu du navigateur ; null s'il n'en est pas un. */
export function nettoyerBilan(brut: unknown): Bilan | null {
  if (typeof brut !== "object" || brut === null) return null;
  const b = brut as Record<string, unknown>;
  const temps = un(b.temps, VALEURS.temps);
  const appareil = un(b.appareil, VALEURS.appareil);
  if (!temps || !appareil) return null;
  const envoye = b.envoye === true;
  return {
    temps,
    appareil,
    sections: parmi(b.sections, VALEURS.sections),
    faq: parmi(b.faq, VALEURS.faq),
    clics: parmi(b.clics, VALEURS.clics),
    abandon: envoye ? null : un(b.abandon, VALEURS.champs),
    envoye,
    sortie: lireSortie(b.sortie),
  };
}

/**
 * Code du bilan dans le nom de fichier : champs séparés par « _ », chacun
 * introduit par une lettre, valeurs séparées par « . ». Ex. :
 * ttemps-1min_atelephone_sformulaire.maisons_chero-appel_e1
 */
export function encoderBilan(b: Bilan): string {
  const champs = [`t${b.temps}`, `a${b.appareil}`];
  if (b.sections.length) champs.push(`s${b.sections.join(".")}`);
  if (b.faq.length) champs.push(`q${b.faq.join(".")}`);
  if (b.clics.length) champs.push(`c${b.clics.join(".")}`);
  if (b.abandon) champs.push(`x${b.abandon}`);
  if (b.envoye) champs.push("e1");
  if (b.sortie) champs.push(`o${b.sortie.zone}.${b.sortie.page}`);
  return champs.join("_");
}

export function decoderBilan(code: string): Bilan | null {
  const champs = new Map(code.split("_").map((c) => [c[0], c.slice(1)] as const));
  const liste = (cle: string) => (champs.get(cle) ?? "").split(".").filter(Boolean);
  const [zone, page] = (champs.get("o") ?? "").split(".");
  return nettoyerBilan({
    temps: champs.get("t"),
    appareil: champs.get("a"),
    sections: liste("s"),
    faq: liste("q"),
    clics: liste("c"),
    abandon: champs.get("x"),
    envoye: champs.get("e") === "1",
    sortie: { zone, page },
  });
}

export interface Analyse {
  visites: number;
  appareils: Record<Appareil, { visites: number; envois: number; appels: number }>;
  sections: Record<Section, number>;
  faq: Record<string, number>;
  clics: Record<string, number>;
  abandons: Record<Champ, number>;
  /** Visiteurs partis vers une autre page du site : combien, vers où, par quel lien. */
  sorties: { total: number; pages: [string, number][]; zones: Record<ZoneSortie, number> };
}

const zeros = <T extends string>(liste: readonly T[]) => Object.fromEntries(liste.map((c) => [c, 0])) as Record<T, number>;
const plusUn = <T extends string>(r: Record<T, number>, ajouts: readonly T[]) =>
  ajouts.reduce((acc, c) => ({ ...acc, [c]: (acc[c] ?? 0) + 1 }), r);

/** Totaux sur des bilans ; « appels » compte les visites qui ont touché au moins un bouton Appeler. */
export function analyser(bilans: Bilan[]): Analyse {
  const sorties = bilans.flatMap((b) => (b.sortie ? [b.sortie] : []));
  const depart: Analyse = {
    visites: 0,
    appareils: Object.fromEntries(VALEURS.appareil.map((a) => [a, { visites: 0, envois: 0, appels: 0 }])) as Analyse["appareils"],
    sections: zeros(VALEURS.sections),
    faq: zeros(VALEURS.faq),
    clics: zeros(VALEURS.clics),
    abandons: zeros(VALEURS.champs),
    sorties: {
      total: sorties.length,
      pages: classer(sorties.map((o) => o.page)),
      zones: plusUn(zeros(VALEURS.zonesSortie), sorties.map((o) => o.zone)),
    },
  };
  return bilans.reduce<Analyse>((a, b) => {
    const app = a.appareils[b.appareil];
    return {
      visites: a.visites + 1,
      appareils: {
        ...a.appareils,
        [b.appareil]: {
          visites: app.visites + 1,
          envois: app.envois + (b.envoye ? 1 : 0),
          appels: app.appels + (b.clics.some((c) => c.endsWith("-appel")) ? 1 : 0),
        },
      },
      sections: plusUn(a.sections, b.sections),
      faq: plusUn(a.faq, b.faq),
      clics: plusUn(a.clics, b.clics),
      abandons: b.abandon ? plusUn(a.abandons, [b.abandon]) : a.abandons,
      sorties: a.sorties,
    };
  }, depart);
}
