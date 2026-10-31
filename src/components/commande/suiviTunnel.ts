import type { EtapeCommande } from "@/lib/suiviCommande";
import { visiteAds } from "@/lib/suiviClient";

const CLE_VUES = "pcmi_commande_etapes";
/** Repli en mémoire si le stockage de session est indisponible : jamais un envoi par frappe au clavier. */
const envoyees = new Set<EtapeCommande>();

/**
 * Compte une étape du tunnel vue dans le navigateur, une fois par session :
 * revenir en arrière ou recharger la page ne recompte pas. Silencieux.
 */
export function suivreEtape(etape: EtapeCommande, formule: string, echeances?: number) {
  if (envoyees.has(etape)) return;
  envoyees.add(etape);
  try {
    const vues = JSON.parse(sessionStorage.getItem(CLE_VUES) ?? "[]") as string[];
    if (vues.includes(etape)) return;
    sessionStorage.setItem(CLE_VUES, JSON.stringify([...vues, etape]));
  } catch {
    /* stockage indisponible : on compte quand même */
  }
  try {
    const corps = JSON.stringify({ etape, formule, echeances, ads: visiteAds() });
    if (!navigator.sendBeacon?.("/api/commande/suivi", corps)) {
      fetch("/api/commande/suivi", { method: "POST", body: corps, keepalive: true }).catch(() => {});
    }
  } catch {
    /* la mesure ne doit jamais casser une commande */
  }
}
