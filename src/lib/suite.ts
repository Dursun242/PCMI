/**
 * Suite du parcours des visiteurs arrivés par /permis-express : pages du site
 * vues ensuite, et contacts pris ailleurs (appel, WhatsApp, demande envoyée).
 * Un petit événement par page vue (une fois par page et par visite) ou par
 * contact ; comme le reste du compteur, rien n'identifie le visiteur.
 * Module pur, importable partout.
 */

export const GENRES_SUITE = ["page", "appel", "whatsapp", "demande"] as const;
export type GenreSuite = (typeof GENRES_SUITE)[number];

export interface Suite {
  genre: GenreSuite;
  /** Clé de page (clePage) ; pour une demande, le formulaire envoyé. */
  valeur: string;
}

const CLE = /^[a-z0-9-]{1,90}$/;
export const estClePage = (v: unknown): v is string => typeof v === "string" && CLE.test(v);
const EXCLUES = new Set(["admin", "api"]);

/** Adresse → clé courte : premier segment, et le deuxième s'il existe (« conseils--mon-article »). */
export function clePage(chemin: string): string | null {
  const segments = chemin.split("/").filter(Boolean).slice(0, 2);
  if (segments.length === 0) return "accueil";
  if (EXCLUES.has(segments[0]) || !segments.every((s) => /^[a-z0-9-]+$/.test(s))) return null;
  const cle = segments.join("--");
  return CLE.test(cle) ? cle : null;
}

const LIBELLES: Record<string, string> = {
  accueil: "Accueil",
  "permis-de-construire-en-ligne": "Permis de construire en ligne",
  "permis-de-construire-maison": "Guide du permis",
  "permis-de-construire-normandie": "Permis en Normandie",
  tarifs: "Tarifs",
  "plans-execution": "Plans EXE",
  "etude-thermique-re2020": "Étude RE2020",
  conseils: "Conseils",
  "references-chantiers": "Réalisations",
  contact: "Contact",
  devis: "Demande de devis",
  dossier: "Fiche projet",
  "plan-de-masse": "Plan de masse",
  "a-propos": "À propos",
  "mentions-legales": "Mentions légales",
  cgv: "CGV",
  confidentialite: "Confidentialité",
  "permis-express": "Page Express",
};

export function libellePage(cle: string): string {
  const [rubrique, detail] = cle.split("--");
  const nom = LIBELLES[rubrique];
  if (!nom) return `/${cle.replace("--", "/")}`;
  return detail ? `${nom} › ${detail}` : nom;
}

export function nettoyerSuite(brut: unknown): Suite | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { genre, valeur } = brut as Record<string, unknown>;
  if (typeof genre !== "string" || !(GENRES_SUITE as readonly string[]).includes(genre)) return null;
  if (typeof valeur !== "string" || !CLE.test(valeur)) return null;
  return { genre: genre as GenreSuite, valeur };
}

/** Code dans le nom de fichier : « genre.valeur ». */
export const encoderSuite = (s: Suite) => `${s.genre}.${s.valeur}`;

export function decoderSuite(code: string): Suite | null {
  const i = code.indexOf(".");
  return i < 0 ? null : nettoyerSuite({ genre: code.slice(0, i), valeur: code.slice(i + 1) });
}

export interface AnalyseSuites {
  /** Pages vues après la page Express, de la plus vue à la moins vue. */
  pages: [string, number][];
  appels: number;
  whatsapp: number;
  /** Demandes envoyées ailleurs sur le site, par formulaire. */
  demandes: [string, number][];
}

/** Occurrences de chaque valeur, de la plus fréquente à la moins fréquente. */
export const classer = (valeurs: string[]): [string, number][] => {
  const n = valeurs.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {});
  return Object.entries(n).sort((a, b) => b[1] - a[1]);
};

export function analyserSuites(suites: Suite[]): AnalyseSuites {
  const de = (g: GenreSuite) => suites.filter((s) => s.genre === g);
  return {
    pages: classer(de("page").map((s) => s.valeur)),
    appels: de("appel").length,
    whatsapp: de("whatsapp").length,
    demandes: classer(de("demande").map((s) => s.valeur)),
  };
}
