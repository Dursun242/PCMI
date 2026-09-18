/**
 * Réalisations réelles (permis obtenus). Remplace la galerie de photos
 * d'illustration (src/components/Gallery.tsx) dès que 3 entrées ou plus
 * existent ici — voir src/components/RealisationsGallery.tsx.
 *
 * Ne pas ajouter de projet fictif : chaque entrée doit correspondre à un
 * permis réellement obtenu, avec des images dont vous détenez les droits.
 * Déposez les images dans public/realisations/ et référencez-les par leur
 * nom de fichier ci-dessous.
 */
export interface Realisation {
  titre: string;
  commune: string;
  departement: string;
  surface: number; // m² de surface de plancher
  formule: "essentiel" | "complet" | "premium";
  annee: number;
  images: string[]; // noms de fichiers dans public/realisations/
  piecesMontrees: string[]; // ex. ["PCMI 2", "PCMI 6"]
  permisAccorde: boolean;
}

export const realisations: Realisation[] = [];
