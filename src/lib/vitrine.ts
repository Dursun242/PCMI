import type { Chantier } from "@/config/references";

/** Une référence telle qu'elle apparaît dans le carrousel : jamais d'adresse ni de coordonnées. */
export type ReferenceVitrine = Pick<Chantier, "titre" | "commune" | "photo">;

/**
 * Les références choisies pour l'accueil, dans l'ordre de la sélection.
 * Une photo qui n'est pas une référence fait échouer le build : le carrousel
 * ne peut montrer que de vrais chantiers d'ID Maîtrise.
 */
export function enVitrine(liste: Chantier[], photos: string[]): ReferenceVitrine[] {
  return photos.map((photo) => {
    const c = liste.find((x) => x.photo === photo);
    if (!c) throw new Error(`Carrousel : ${photo} n'est pas une référence de src/config/references.ts`);
    return { titre: c.titre, commune: c.commune, photo: c.photo };
  });
}
