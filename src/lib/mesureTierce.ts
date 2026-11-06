/**
 * Pages où rien ne part vers les outils de mesure extérieurs (Umami, Vercel Analytics, balise Google Ads) :
 * - l'espace admin ;
 * - le parcours DP piscine (novembre 2026) : mesuré en interne seulement (lib/suiviDp.ts, /admin/dp-piscine), et sa
 *   page de suivi porte dans son adresse la clé du dossier, qui ne doit jamais sortir du site.
 */
export function sansMesureTierce(chemin: string): boolean {
  return chemin.startsWith("/admin") || chemin === "/dp-piscine" || chemin.startsWith("/dp-piscine/");
}
