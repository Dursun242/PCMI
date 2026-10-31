/*
 * Commande en cours dans cet onglet (sessionStorage), partagée par le tunnel
 * et la page de reprise envoyée par e-mail.
 */

/** Commande créée chez Qonto, pas encore confirmée : gardée le temps de l'onglet pour survivre à un rechargement. */
export interface CommandeEnCours {
  jeton: string;
  urlMandat: string;
  /** Devis accepté : on reprend alors à l'IBAN, sinon au devis. */
  accepte?: boolean;
}
const CLE_COMMANDE_EN_COURS = "pmi-commande-en-cours";

export function lireCommandeEnCours(): CommandeEnCours | null {
  try {
    const brut = sessionStorage.getItem(CLE_COMMANDE_EN_COURS);
    const c = brut ? JSON.parse(brut) : null;
    return c && typeof c.jeton === "string" && typeof c.urlMandat === "string" ? c : null;
  } catch {
    return null;
  }
}

export function ecrireCommandeEnCours(c: CommandeEnCours | null) {
  try {
    if (c) sessionStorage.setItem(CLE_COMMANDE_EN_COURS, JSON.stringify(c));
    else sessionStorage.removeItem(CLE_COMMANDE_EN_COURS);
  } catch {
    /* stockage indisponible (navigation privée) : la commande reste suivie tant que la page est ouverte */
  }
}
