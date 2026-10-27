/**
 * Communes de la périphérie des agglomérations (Rouen, Caen, Dieppe) : c'est
 * là que se vendent les terrains à bâtir, donc là que se montent les permis.
 *
 * Mêmes règles que src/config/normandie.ts : chaque fait porte sa source, et
 * les tests refusent une page sans contenu propre. Le nombre d'indices de
 * cavités vient de la base nationale du BRGM, relevée sur l'API Géorisques ;
 * le lien cité ouvre la fiche des risques de la commune.
 */
import type { Ville } from "./normandie";

export const communesPeripherie: Ville[] = [];
