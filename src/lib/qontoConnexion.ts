import "server-only";
import { createHash } from "node:crypto";
import { del, list, put } from "@vercel/blob";
import { site } from "@/config/site";
import { sendToClient } from "@/lib/mailer";
import { configQonto, type ConfigQonto } from "@/lib/qonto";
import { chiffrer, configOAuth, dechiffrer, ErreurConnexionQonto, jetonAcces, type Jetons, type StockageJetons } from "@/lib/qontoOAuth";

/**
 * Jetons OAuth Qonto, chiffrés, dans le stockage Vercel Blob du site.
 *
 * Chaque enregistrement est un nouveau fichier (chemin unique) : une adresse
 * réécrite pourrait être resservie depuis un cache, et un vieux jeton de
 * renouvellement est refusé par Qonto. On lit toujours le plus récent, et on
 * efface les anciens. Le dossier dérive du secret de l'application, les
 * fichiers portent un suffixe aléatoire et leur contenu est chiffré.
 */

const FICHIERS_CONSERVES = 3;

function dossier(secret: string) {
  return `qonto-oauth/${createHash("sha256").update(secret).digest("hex").slice(0, 24)}/`;
}

function stockageBlob(secret: string): StockageJetons {
  const prefixe = dossier(secret);
  const fichiers = async () =>
    (await list({ prefix: prefixe, limit: 100 })).blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  return {
    async lire() {
      const [dernier] = await fichiers();
      if (!dernier) return null;
      const res = await fetch(dernier.url, { cache: "no-store" });
      const clair = res.ok ? dechiffrer(await res.text(), secret) : null;
      return clair ? (JSON.parse(clair) as Jetons) : null;
    },
    async ecrire(jetons) {
      await put(`${prefixe}${Date.now()}.txt`, chiffrer(JSON.stringify(jetons), secret), {
        access: "public",
        contentType: "text/plain",
        addRandomSuffix: true,
      });
      const anciens = (await fichiers()).slice(FICHIERS_CONSERVES);
      if (anciens.length) await del(anciens.map((b) => b.url)).catch((err) => console.error("[qonto] nettoyage des anciens jetons", err));
    },
  };
}

/**
 * En local sans stockage Vercel : jetons gardés en mémoire, le temps du
 * serveur de développement. Sur globalThis, car chaque route y a sa propre
 * copie des modules.
 */
const memoire = globalThis as typeof globalThis & { __pcmiJetonsQonto?: Jetons | null };
const stockageMemoire: StockageJetons = {
  lire: async () => memoire.__pcmiJetonsQonto ?? null,
  ecrire: async (j) => void (memoire.__pcmiJetonsQonto = j),
};

export function stockageJetons(secret: string): StockageJetons {
  return process.env.BLOB_READ_WRITE_TOKEN ? stockageBlob(secret) : stockageMemoire;
}

/** Une alerte par heure au plus et par instance : la connexion tombée ne doit pas inonder la boîte. */
const INTERVALLE_ALERTE_MS = 60 * 60 * 1000;
let derniereAlerte = 0;

async function alerterAdmin(raison: string) {
  if (Date.now() - derniereAlerte < INTERVALLE_ALERTE_MS) return;
  derniereAlerte = Date.now();
  try {
    await sendToClient({
      to: process.env.MAIL_TO ?? site.email,
      subject: "Commande en ligne bloquée : reconnectez Qonto",
      html: `<p style="font-family:Lato,Arial,sans-serif">La commande en ligne ne peut plus créer de mandat chez Qonto : ${raison}</p>
        <p style="font-family:Lato,Arial,sans-serif">Ouvrez <a href="${site.url}/admin">l'espace admin</a> et cliquez sur « Connecter Qonto ».</p>`,
    });
  } catch (err) {
    console.error("[qonto] alerte non envoyée", err);
  }
}

/**
 * Configuration prête pour appeler Qonto (jeton d'accès OAuth valable).
 * Lève ErreurConnexionQonto si l'application n'est pas configurée ou plus
 * connectée, après avoir prévenu l'administrateur.
 */
export async function ouvrirQonto(): Promise<ConfigQonto> {
  const cfg = configOAuth();
  if (!cfg) {
    const raison = "QONTO_CLIENT_ID / QONTO_CLIENT_SECRET absentes";
    console.error(`[qonto] ${raison}`);
    await alerterAdmin(raison);
    throw new ErreurConnexionQonto(raison);
  }
  try {
    return configQonto(await jetonAcces(cfg, stockageJetons(cfg.clientSecret)));
  } catch (err) {
    const raison = err instanceof Error ? err.message : String(err);
    console.error(`[qonto] connexion impossible : ${raison}`);
    await alerterAdmin(raison);
    throw err instanceof ErreurConnexionQonto ? err : new ErreurConnexionQonto(raison);
  }
}

export interface EtatConnexion {
  configuree: boolean;
  connectee: boolean;
}

/** Pour l'espace admin : l'application est-elle renseignée, et Qonto connecté ? (sans renouveler de jeton) */
export async function etatConnexion(): Promise<EtatConnexion> {
  const cfg = configOAuth();
  if (!cfg) return { configuree: false, connectee: false };
  try {
    return { configuree: true, connectee: Boolean(await stockageJetons(cfg.clientSecret).lire()) };
  } catch (err) {
    console.error("[qonto] lecture de l'état de connexion", err);
    return { configuree: true, connectee: false };
  }
}
