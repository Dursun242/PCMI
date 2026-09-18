/**
 * Chiffres de preuve affichés sur l'accueil (section juste sous le hero).
 * Chaque champ est optionnel : un chiffre non renseigné n'apparaît pas.
 * Ne renseignez que des chiffres réels, vérifiables.
 */
export interface ChiffresCles {
  permisDeposes?: number; // nombre de permis déposés à ce jour
  tauxAccordPremierDepot?: number; // en %, ex. 96
  noteGoogle?: number; // sur 5, ex. 4.9
}

export const chiffresCles: ChiffresCles = {
  permisDeposes: 125,
  tauxAccordPremierDepot: 100,
  noteGoogle: 5,
};
