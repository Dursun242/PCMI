/**
 * Communes de la périphérie des agglomérations, un fichier par agglomération.
 * Voir commun.ts pour les règles de sourçage.
 */
import type { Ville } from "../normandie";
import { communesDieppe } from "./dieppe";
import { communesRouen } from "./rouen";

export const communesPeripherie: Ville[] = [...communesRouen, ...communesDieppe];
