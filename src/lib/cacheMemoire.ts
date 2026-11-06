/**
 * Petit cache en mémoire pour les lectures de l'espace d'administration.
 *
 * Chaque page de l'admin relit les compteurs dans Vercel Blob, et chaque page de
 * 1 000 événements lue coûte une opération « avancée » (2 000 par mois en offre
 * gratuite, tout le site confondu). Gardés quelques minutes dans l'instance, les
 * chiffres affichés peuvent avoir jusqu'à TTL de retard, mais recharger
 * l'admin ne coûte plus rien.
 */
export const TTL_ADMIN_MS = 3 * 60_000;

interface Entree {
  expire: number;
  valeur: Promise<unknown>;
}

const entrees = new Map<string, Entree>();

/** Renvoie la valeur gardée pour `cle`, ou la calcule (une erreur n'est jamais gardée). */
export function enCache<T>(cle: string, f: () => Promise<T>, ttl = TTL_ADMIN_MS, maintenant = Date.now()): Promise<T> {
  const e = entrees.get(cle);
  if (e && e.expire > maintenant) return e.valeur as Promise<T>;
  const valeur = f();
  entrees.set(cle, { expire: maintenant + ttl, valeur });
  valeur.catch(() => {
    if (entrees.get(cle)?.valeur === valeur) entrees.delete(cle);
  });
  return valeur;
}

/** Oublie une valeur gardée (après une écriture qui la rend fausse). */
export function oublier(cle: string): void {
  entrees.delete(cle);
}
