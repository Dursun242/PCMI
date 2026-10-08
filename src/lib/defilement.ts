/**
 * Sens du défilement, lu par l'en-tête (Header.tsx) : il s'efface quand on
 * descend et revient quand on remonte. Fonction pure, sans DOM, pour être testée.
 */

export type Sens = "haut" | "bas";

export interface EtatDefilement {
  sens: Sens;
  /** Point extrême atteint dans le sens courant. */
  repere: number;
  /** Faux en haut de page : l'en-tête reste affiché quoi qu'il arrive. */
  actif: boolean;
}

/** En dessous, on est « en haut de page ». */
export const HAUT_DE_PAGE = 100;
/** Hystérésis : descendre de 16 px pour masquer, remonter de 48 px pour réafficher.
 *  Les petits à-coups du doigt ou de l'élan ne font pas clignoter l'en-tête. */
export const SEUIL_MASQUER = 16;
export const SEUIL_REAFFICHER = 48;
/** Marge du rebond élastique de fin de page (iPhone). */
const REBOND = 4;

export const ETAT_INITIAL: EtatDefilement = { sens: "haut", repere: 0, actif: false };

export function suivreDefilement(etat: EtatDefilement, y: number, yMax: number): EtatDefilement {
  if (y < HAUT_DE_PAGE) return { sens: "haut", repere: y, actif: false };
  if (y > yMax - REBOND) return etat;

  if (etat.sens === "bas") {
    if (y > etat.repere) return { ...etat, repere: y, actif: true };
    if (etat.repere - y > SEUIL_REAFFICHER) return { sens: "haut", repere: y, actif: true };
    return { ...etat, actif: true };
  }
  if (y < etat.repere) return { ...etat, repere: y, actif: true };
  if (y - etat.repere > SEUIL_MASQUER) return { sens: "bas", repere: y, actif: true };
  return { ...etat, actif: true };
}
