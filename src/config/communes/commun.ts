/**
 * Communes de la périphérie des agglomérations (Rouen, Caen, Dieppe) : c'est
 * là que se vendent les terrains à bâtir, donc là que se montent les permis.
 *
 * Mêmes règles que src/config/normandie.ts : chaque fait porte sa source, et
 * les tests refusent une page sans contenu propre. Le nombre d'indices de
 * cavités vient de la base nationale du BRGM, relevée sur l'API Géorisques le
 * 27 octobre 2026 ; le lien cité ouvre la fiche des risques de la commune.
 * Les communes voisines sont calculées à partir des contours officiels
 * (geo.api.gouv.fr), les monuments historiques vérifiés dans la base Mérimée.
 */
import type { Fait, Source } from "../normandie";

/** Date de la dernière revue des pages communes. */
export const REVUE = "2026-10-27";

export function georisques(nom: string, insee: string): Source {
  return {
    label: `Géorisques, risques sur la commune de ${nom}`,
    url: `https://www.georisques.gouv.fr/mes-risques/connaitre-les-risques-pres-de-chez-moi/rapport2?form-commune=true&codeInsee=${insee}&ign=false&CGU-commune=on&commune=${insee}`,
  };
}

/** Nombre d'indices recensés, avec le détail quand il éclaire le risque. */
export function cavitesRecensees(nom: string, insee: string, indices: number, detail = ""): Fait {
  return {
    texte: `La base nationale des cavités souterraines recense ${indices} indices sur ${nom}${detail}. Avant d'acheter un terrain, vérifiez sur la carte qu'aucun ne se trouve à proximité de la parcelle.`,
    source: georisques(nom, insee),
  };
}
