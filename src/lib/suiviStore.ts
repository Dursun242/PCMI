import "server-only";
import { list, put } from "@vercel/blob";
import { cheminEvenement, jourParis, lireChemin, PREFIXE_SUIVI, type Evenement, type SourceSuivi, type TypeSuivi } from "./suivi";

/**
 * Accès au stockage du compteur (Vercel Blob, jeton BLOB_READ_WRITE_TOKEN).
 * Sans jeton, rien n'est enregistré et le tableau de bord le signale.
 */
export function suiviConfigure(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Enregistre un événement. Ne lève jamais : la mesure ne doit pas casser un parcours. */
export async function enregistrer(type: TypeSuivi, source: SourceSuivi): Promise<void> {
  if (!suiviConfigure()) return;
  const evenement: Evenement = { jour: jourParis(new Date()), type, source };
  try {
    await put(cheminEvenement(evenement, crypto.randomUUID()), "1", {
      access: "public",
      contentType: "text/plain",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("[suivi] enregistrement impossible", err);
  }
}

/** Plafond de pages lues (1 000 événements chacune) : au-delà, le compteur est tronqué. */
const PAGES_MAX = 20;

/** Tous les événements enregistrés, relus depuis les chemins. */
export async function lireEvenements(): Promise<{ evenements: Evenement[]; tronque: boolean }> {
  const evenements: Evenement[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < PAGES_MAX; page++) {
    const res = await list({ prefix: PREFIXE_SUIVI, cursor, limit: 1000 });
    for (const b of res.blobs) {
      const ev = lireChemin(b.pathname);
      if (ev) evenements.push(ev);
    }
    if (!res.hasMore) return { evenements, tronque: false };
    cursor = res.cursor;
  }
  return { evenements, tronque: true };
}
