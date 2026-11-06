import "server-only";
import { enCache } from "./cacheMemoire";
import { d1Configure, evtAjouter, evtChemins } from "./d1";
import { jourParis } from "./suivi";
import { cheminDp, lireCheminDp, PREFIXE_DP, type EtapeDp } from "./suiviDp";

/**
 * Stockage du compteur DP piscine (lib/suiviDp.ts) : Cloudflare D1 seulement. Sans D1, rien n'est compté
 * (jamais dans Vercel Blob, dont le quota ne le supporte pas) et /admin/dp-piscine le signale.
 */
export const suiviDpConfigure = () => d1Configure();

/** Compte une étape. Ne lève jamais : la mesure ne doit pas casser un parcours. */
export async function enregistrerDp(etape: EtapeDp): Promise<void> {
  if (!d1Configure()) return;
  const maintenant = new Date();
  try {
    await evtAjouter(cheminDp(etape, jourParis(maintenant), crypto.randomUUID()), maintenant.getTime());
  } catch (err) {
    console.error("[dp-piscine] mesure impossible", err);
  }
}

/** Toutes les étapes comptées, gardées quelques minutes (cacheMemoire). */
export function lireEvenementsDp(): Promise<{ evenements: { jour: string; etape: EtapeDp }[]; tronque: boolean }> {
  return enCache("suivi-dp-piscine", async () => {
    const { chemins, tronque } = await evtChemins(PREFIXE_DP);
    const evenements = chemins.map(lireCheminDp).filter((e): e is { jour: string; etape: EtapeDp } => e !== null);
    return { evenements, tronque };
  });
}
