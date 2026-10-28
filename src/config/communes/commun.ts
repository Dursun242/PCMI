/**
 * Communes de la périphérie des agglomérations (Rouen, Caen, Dieppe) : c'est
 * là que se vendent les terrains à bâtir, donc là que se montent les permis.
 *
 * Mêmes règles que src/config/normandie.ts : chaque fait porte sa source, et
 * les tests refusent une page sans contenu propre. Les chiffres (population,
 * cavités, catastrophes naturelles) sont dans reperes.ts ; les phrases qui
 * les citent sont construites ici pour que chaque page dise ses propres
 * chiffres plutôt qu'un texte commun où seul le nom change.
 * Les communes voisines sont calculées à partir des contours officiels
 * (geo.api.gouv.fr), les monuments historiques vérifiés dans la base Mérimée.
 */
import type { Fait, Reperes, Source } from "../normandie";

/** Date de la dernière revue des pages communes. */
export const REVUE = "2026-10-28";

export function georisques(nom: string, insee: string): Source {
  return {
    label: `Géorisques, risques sur la commune de ${nom}`,
    url: `https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi/rapport2?form-commune=true&codeInsee=${insee}&ign=false&CGU-commune=on&commune=${insee}`,
  };
}

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

/** « 34 anciennes carrières, 38 cavités naturelles et 109 indices d'origine indéterminée ». */
function detailCavites(c: Reperes["cavites"]): string {
  const parts = [
    c.carrieres && pluriel(c.carrieres, "ancienne carrière", "anciennes carrières"),
    c.naturelles && pluriel(c.naturelles, "cavité naturelle", "cavités naturelles"),
    c.ouvrages && pluriel(c.ouvrages, "ouvrage souterrain", "ouvrages souterrains"),
    c.indeterminees && pluriel(c.indeterminees, "indice d'origine indéterminée", "indices d'origine indéterminée"),
  ].filter(Boolean) as string[];
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} et ${parts.at(-1)}` : parts[0] ?? "";
}

/** Les cavités recensées sur la commune, par type, avec la densité quand elle parle. */
export function cavitesRecensees(nom: string, r: Reperes, precision = ""): Fait {
  const c = r.cavites;
  const densite = c.total >= 10 ? `, soit ${Math.round(c.total / r.superficieKm2)} au km²` : "";
  return {
    texte: `${pluriel(c.total, "indice de cavité est recensé", "indices de cavités sont recensés")} sur ${nom}${densite} : ${detailCavites(c)}${precision}.`,
    source: georisques(nom, r.insee),
  };
}

/** Les arrêtés de catastrophe naturelle de la commune : un historique, pas une prévision. */
export function catastrophesNaturelles(nom: string, r: Reperes): Fait {
  const k = r.catnat;
  return {
    texte: `Depuis ${k.depuis}, ${nom} a fait l'objet de ${pluriel(k.total, "arrêté de catastrophe naturelle", "arrêtés de catastrophe naturelle")}, dont ${k.inondations} pour des inondations ; le plus récent porte sur un épisode de ${k.dernier} (${k.dernierRisque}).`,
    source: georisques(nom, r.insee),
  };
}
