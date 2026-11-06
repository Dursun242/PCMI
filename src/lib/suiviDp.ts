/**
 * Compteur du parcours DP piscine (/dp-piscine puis /dp-piscine/suivi), affiché dans /admin/dp-piscine.
 *
 * Mesuré en interne seulement (Cloudflare D1, table evenements, comme le compteur Express) : depuis novembre
 * 2026, plus rien de ce parcours ne part vers Umami, Vercel Analytics ni Google (lib/mesureTierce.ts) ; la page
 * de suivi porte dans son adresse la clé du dossier.
 *
 * Un événement = un chemin : suivi/dp-piscine/<jour>/<etape>/<id>. Aucune donnée personnelle, ni dossier, ni
 * parcelle : seulement l'étape franchie et le jour (heure de Paris). Module pur, testé.
 */

export const PREFIXE_DP = "suivi/dp-piscine/";

/** Les étapes du parcours, dans l'ordre, avec leur libellé dans l'admin. */
export const ETAPES_DP = [
  ["vue", "Visites de la page"],
  ["terrain", "Terrain trouvé"],
  ["lancee", "Dossier lancé"],
  ["emplacement", "Emplacement du bassin validé"],
  ["coupe", "Coupe validée"],
  ["photomontage", "Photomontage validé (bassin vu de la rue)"],
  ["apercu", "Aperçu du dossier vu"],
  ["payer", "Paiement demandé"],
  ["paye", "Dossier payé"],
] as const;
export type EtapeDp = (typeof ETAPES_DP)[number][0];

const CLES = new Set<string>(ETAPES_DP.map(([e]) => e));
export const estEtapeDp = (v: unknown): v is EtapeDp => typeof v === "string" && CLES.has(v);

const JOUR = /^\d{4}-\d{2}-\d{2}$/;

export function cheminDp(etape: EtapeDp, jour: string, id: string): string {
  return `${PREFIXE_DP}${jour}/${etape}/${id}`;
}

/** Relit un chemin ; null s'il ne vient pas de ce compteur. */
export function lireCheminDp(chemin: string): { jour: string; etape: EtapeDp } | null {
  if (!chemin.startsWith(PREFIXE_DP)) return null;
  const [jour, etape] = chemin.slice(PREFIXE_DP.length).split("/");
  return JOUR.test(jour ?? "") && estEtapeDp(etape) ? { jour, etape } : null;
}

export type CompteursDp = Record<EtapeDp, number>;

/** Nombre d'événements par étape, depuis `depuis` inclus (AAAA-MM-JJ) ou depuis toujours. */
export function compterDp(evenements: readonly { jour: string; etape: EtapeDp }[], depuis?: string): CompteursDp {
  const c = Object.fromEntries(ETAPES_DP.map(([e]) => [e, 0])) as CompteursDp;
  for (const ev of evenements) if (!depuis || ev.jour >= depuis) c[ev.etape] += 1;
  return c;
}
