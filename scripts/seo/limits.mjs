/**
 * Longueurs maximales des balises, en caractères.
 *
 * Google n'affiche qu'environ 600 px de titre et 920 px de description, soit
 * à peu près 65 et 160 caractères en français. Au-delà, la fin est coupée par
 * des points de suspension — ou le titre est carrément réécrit par Google.
 *
 * Les prompts des scripts SEO demandent déjà ces longueurs au modèle, mais un
 * prompt n'est pas un contrat : ces constantes servent à VÉRIFIER ce qui est
 * réellement écrit sur le disque.
 */
export const TITLE_MAX = 65;
export const DESCRIPTION_MAX = 160;

/**
 * Raccourcit un texte sans couper un mot en deux : on tronque à la dernière
 * limite de mot qui tient, et on retire la ponctuation orpheline laissée par
 * la coupe.
 */
export function trimTo(text, max) {
  const s = String(text).trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:—–-]+$/, "");
}
