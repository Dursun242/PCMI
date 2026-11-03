import { joursAvant } from "./suivi";

/**
 * Indicateurs du tableau de bord de l'espace admin : un nombre sur 7 jours,
 * comparé aux 7 jours d'avant, avec la courbe des 14 derniers jours.
 * Module pur (testé) : il reçoit les jours (AAAA-MM-JJ, heure de Paris) où
 * l'événement compté a eu lieu, un par occurrence.
 */

const JOURS_SERIE = 14;
const JOURS_SEMAINE = 7;

export interface Indicateur {
  aujourdhui: number;
  semaine: number;
  semainePrecedente: number;
  /** Les 14 derniers jours, du plus ancien au plus récent. */
  serie: number[];
}

export function indicateur(jours: readonly string[], aujourdhui: string): Indicateur {
  const parJour = new Map<string, number>();
  for (const j of jours) parJour.set(j, (parJour.get(j) ?? 0) + 1);
  const serie = Array.from({ length: JOURS_SERIE }, (_, i) => parJour.get(joursAvant(aujourdhui, JOURS_SERIE - 1 - i)) ?? 0);
  const somme = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return {
    aujourdhui: serie[JOURS_SERIE - 1],
    semaine: somme(serie.slice(JOURS_SERIE - JOURS_SEMAINE)),
    semainePrecedente: somme(serie.slice(0, JOURS_SERIE - JOURS_SEMAINE)),
    serie,
  };
}

export type Sens = "hausse" | "baisse" | "stable";

export function evolution(i: Pick<Indicateur, "semaine" | "semainePrecedente">): { sens: Sens; texte: string } {
  const ecart = i.semaine - i.semainePrecedente;
  if (i.semaine === 0 && i.semainePrecedente === 0) return { sens: "stable", texte: "Rien sur 14 j" };
  if (ecart === 0) return { sens: "stable", texte: "Stable sur 7 j" };
  return ecart > 0 ? { sens: "hausse", texte: `+${ecart} sur 7 j` } : { sens: "baisse", texte: `−${-ecart} sur 7 j` };
}
