/**
 * Mesure du parcours sur tout le site, envoyée à Umami (components/MesureSite.tsx) :
 * l'équivalent du compteur de /permis-express, sans stockage chez Vercel.
 * Que des libellés de parcours (page, pourcentage, tranche de temps, NOM d'un
 * champ, domaine d'un lien) : jamais ce que le visiteur a saisi. Module pur.
 */
import { TRANCHES_TEMPS, trancheTemps } from "./bilan";

/** Paliers de lecture, en pourcentage de la hauteur de la page. */
export const NIVEAUX_LECTURE = [25, 50, 75, 100] as const;
export type NiveauLecture = (typeof NIVEAUX_LECTURE)[number];

/** Paliers franchis à `pourcent` et pas encore envoyés pour cette page. */
export function niveauxNouveaux(pourcent: number, deja: ReadonlySet<number>): NiveauLecture[] {
  return NIVEAUX_LECTURE.filter((n) => pourcent >= n && !deja.has(n));
}

/** Part de la page vue, bas de l'écran compris (100 quand le bas de page est atteint, à 2 px près). */
export function pourcentLu(defilement: number, hauteurEcran: number, hauteurPage: number): number {
  if (hauteurPage <= hauteurEcran) return 100;
  const bas = defilement + hauteurEcran;
  return bas >= hauteurPage - 2 ? 100 : Math.max(0, Math.round((bas / hauteurPage) * 100));
}

/** Temps passé, en libellé lisible dans Umami (« 30 s à 1 min »). */
export function libelleTemps(ms: number): string {
  const t = trancheTemps(ms);
  return TRANCHES_TEMPS.find(([cle]) => cle === t)?.[2] ?? t;
}

/** Texte court et sur une ligne, pour un libellé d'événement. */
export function resumer(texte: string | null | undefined, max = 60): string {
  const t = (texte ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export type CibleLien = "appel" | "whatsapp" | "e-mail" | "devis" | "externe" | "interne" | "ancre";

/** Nature d'un lien d'après son adresse, relativement à l'origine du site. */
export function cibleLien(href: string, origine: string): CibleLien {
  if (href.startsWith("tel:")) return "appel";
  if (href.startsWith("mailto:")) return "e-mail";
  if (href.startsWith("#")) return "ancre";
  let url: URL;
  try {
    url = new URL(href, origine);
  } catch {
    return "interne";
  }
  if (/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(url.hostname)) return "whatsapp";
  if (url.origin !== new URL(origine).origin) return "externe";
  if (url.pathname.startsWith("/devis") || url.hash === "#devis") return "devis";
  return "interne";
}

/** Domaine d'un lien externe, sans « www. » ; null si l'adresse est illisible. */
export function domaine(href: string): string | null {
  try {
    return new URL(href).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
