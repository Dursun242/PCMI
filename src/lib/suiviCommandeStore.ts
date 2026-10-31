import "server-only";
import { list, put } from "@vercel/blob";
import { appareilDeLAdmin } from "./adminAuth";
import { jourParis } from "./suivi";
import {
  cheminCommande,
  lireCheminCommande,
  nettoyerEcheances,
  nettoyerFormule,
  PREFIXE_SUIVI_COMMANDE,
  type EtapeCommande,
  type EvenementCommande,
} from "./suiviCommande";
import { suiviConfigure } from "./suiviStore";

const ROBOTS = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor/i;

export interface DetailCommande {
  formule?: unknown;
  echeances?: unknown;
  ads?: unknown;
}

/**
 * Compte une étape du tunnel de commande. Ni les robots ni l'appareil de
 * l'administrateur (ses commandes de test) ne comptent. Ne lève jamais : la
 * mesure ne doit pas casser une commande.
 */
export async function suivreCommande(req: Request, etape: EtapeCommande, detail: DetailCommande = {}): Promise<void> {
  try {
    if (!suiviConfigure() || ROBOTS.test(req.headers.get("user-agent") ?? "")) return;
    if (await appareilDeLAdmin(req.headers.get("cookie"))) return;
    const maintenant = new Date();
    const evenement: EvenementCommande = {
      jour: jourParis(maintenant),
      etape,
      source: detail.ads === true ? "ads" : "direct",
      instant: maintenant.getTime(),
      formule: nettoyerFormule(detail.formule),
      echeances: nettoyerEcheances(detail.echeances),
    };
    await put(cheminCommande(evenement, crypto.randomUUID()), "1", {
      access: "public",
      contentType: "text/plain",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("[suivi commande] enregistrement impossible", err);
  }
}

/** Plafond de pages lues (1 000 événements chacune) : au-delà, le compteur est tronqué. */
const PAGES_MAX = 20;

export async function lireEvenementsCommande(): Promise<{ evenements: EvenementCommande[]; tronque: boolean }> {
  const evenements: EvenementCommande[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < PAGES_MAX; page++) {
    const res = await list({ prefix: PREFIXE_SUIVI_COMMANDE, cursor, limit: 1000 });
    for (const b of res.blobs) {
      const ev = lireCheminCommande(b.pathname);
      if (ev) evenements.push(ev);
    }
    if (!res.hasMore) return { evenements, tronque: false };
    cursor = res.cursor;
  }
  return { evenements, tronque: true };
}
