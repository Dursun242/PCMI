import "server-only";

/**
 * Lecture directe d'un fichier public de Vercel Blob par son adresse, sans `list()`.
 *
 * `list()` et `put()` sont des opérations « avancées » : 2 000 par mois sur le plan Hobby, et le stockage est coupé
 * 30 jours au-delà (alerte Vercel à 75 % le 06/11/2026). Lire un fichier par son adresse est une opération « simple »
 * (10 000 par mois), et ne compte même pas quand le CDN l'a en cache. L'adresse se déduit du jeton, comme le fait le
 * SDK : https://<storeId>.public.blob.vercel-storage.com/<chemin>.
 */
export function urlPublique(chemin: string, env: Record<string, string | undefined> = process.env): string | null {
  const jeton = env.BLOB_READ_WRITE_TOKEN;
  if (!jeton) return null;
  const [, , , storeId = ""] = jeton.split("_");
  if (!/^[A-Za-z0-9]+$/.test(storeId)) return null;
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com/${chemin}`;
}

/**
 * Fichier JSON public lu directement ; null s'il n'existe pas. `frais` : contourne le cache du CDN (une opération
 * simple de plus), pour une lecture qui doit voir la toute dernière écriture.
 */
export async function lireJsonPublic<T>(chemin: string, frais = false): Promise<T | null> {
  const url = urlPublique(chemin);
  if (!url) return null;
  const r = await fetch(frais ? `${url}?v=${Date.now()}` : url, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Blob ${r.status} sur ${chemin}`);
  return (await r.json()) as T;
}
