/**
 * Côté navigateur : compte une étape du parcours DP piscine dans le compteur interne (/api/dp-piscine/mesure,
 * Cloudflare D1, visible dans /admin/dp-piscine). Rien ne part vers Umami, Vercel Analytics ni Google.
 * `unique` : une seule fois par onglet pour cette clé (une visite, l'aperçu d'un dossier).
 */
import type { EtapeDp } from "./suiviDp";

export function mesurerDp(etape: EtapeDp, unique?: string) {
  try {
    if (unique) {
      const cle = `pcmi_dp_${etape}_${unique}`;
      if (sessionStorage.getItem(cle)) return;
      sessionStorage.setItem(cle, "1");
    }
  } catch {
    /* stockage indisponible : l'étape peut être comptée deux fois */
  }
  try {
    const corps = JSON.stringify({ etape });
    // sendBeacon survit au changement de page (lancement du dossier, départ vers le paiement).
    if (!navigator.sendBeacon?.("/api/dp-piscine/mesure", corps)) {
      fetch("/api/dp-piscine/mesure", { method: "POST", body: corps, keepalive: true }).catch(() => {});
    }
  } catch {
    /* la mesure ne doit jamais casser un parcours */
  }
}
