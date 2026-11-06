import "server-only";
import { list, put } from "@vercel/blob";
import { enCache, oublier } from "./cacheMemoire";
import { d1Configure, evtAjouter, evtChemins } from "./d1";
import {
  cheminEvenement,
  cheminZero,
  depuisRemise,
  derniereRemise,
  jourParis,
  lireChemin,
  PREFIXE_SUIVI,
  PREFIXE_ZERO,
  type Evenement,
  type SourceSuivi,
  type TypeSuivi,
} from "./suivi";

/**
 * Accès au stockage du compteur : Cloudflare D1 (d1.ts) quand il est configuré, sinon Vercel Blob (jeton
 * BLOB_READ_WRITE_TOKEN). Un événement = une ligne de D1 portant le même chemin codé qu'avant dans Blob.
 * Sans stockage, rien n'est enregistré et le tableau de bord le signale.
 */
export function suiviConfigure(): boolean {
  return d1Configure() || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Enregistre un événement. Ne lève jamais : la mesure ne doit pas casser un parcours. */
export async function enregistrer(
  type: TypeSuivi,
  source: SourceSuivi,
  detail: Pick<Evenement, "bilan" | "suite"> = {},
): Promise<void> {
  if (!suiviConfigure()) return;
  const maintenant = new Date();
  const evenement: Evenement = { jour: jourParis(maintenant), type, source, instant: maintenant.getTime(), ...detail };
  try {
    if (d1Configure()) return await evtAjouter(cheminEvenement(evenement, crypto.randomUUID()), evenement.instant);
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

/** Pose une remise à zéro : rien n'est effacé, les événements antérieurs sont simplement ignorés. */
export async function remettreAZero(): Promise<number> {
  const instant = Date.now();
  if (d1Configure()) {
    await evtAjouter(cheminZero(instant), instant);
    oublier(CLE_CACHE);
    return instant;
  }
  await put(cheminZero(instant), "1", { access: "public", contentType: "text/plain", addRandomSuffix: false });
  oublier(CLE_CACHE);
  return instant;
}

const CLE_CACHE = "suivi-express";

/** Événements comptés depuis la dernière remise à zéro, et l'instant de cette remise (0 si aucune). Gardés quelques minutes (cacheMemoire). */
export function lireEvenements(): Promise<{ evenements: Evenement[]; tronque: boolean; zero: number }> {
  return enCache(CLE_CACHE, lireEvenementsStockage);
}

async function lireEvenementsStockage(): Promise<{ evenements: Evenement[]; tronque: boolean; zero: number }> {
  if (d1Configure()) {
    const [zeros, tous] = await Promise.all([evtChemins(PREFIXE_ZERO), evtChemins(PREFIXE_SUIVI)]);
    const zero = derniereRemise(zeros.chemins);
    const evenements = tous.chemins.map(lireChemin).filter((e): e is Evenement => e !== null);
    return { evenements: depuisRemise(evenements, zero), tronque: tous.tronque, zero };
  }
  const zeros = await list({ prefix: PREFIXE_ZERO, limit: 1000 });
  const zero = derniereRemise(zeros.blobs.map((b) => b.pathname));
  const { evenements, tronque } = await lireTous();
  return { evenements: depuisRemise(evenements, zero), tronque, zero };
}

async function lireTous(): Promise<{ evenements: Evenement[]; tronque: boolean }> {
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
