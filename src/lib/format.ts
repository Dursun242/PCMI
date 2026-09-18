/** Date longue en français, ex. "17 septembre 2026". Utilisée pour les articles et le guide. */
export function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
