/** Date longue en français, ex. "17 septembre 2026". Utilisée pour les articles et le guide. */
export function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** Montant en euros, sans décimales, format français. Ex. "1 490 €". */
export function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
