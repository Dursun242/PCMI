import "server-only";
import { site } from "@/config/site";
import { emailClientPaye, emailInterne, lienSuivi, type ContactDp } from "@/lib/emailsDpPiscine";
import { sendInternal, sendToClient } from "@/lib/mailer";
import { dechiffrer, secretPlanche } from "@/lib/plancheSecret";
import { lireLienPaiement } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";
import { jetonValide, lireDp, majDp, type EntreeDp } from "@/lib/dpPiscineStore";

/** Clé des signatures et du chiffrement : la même que la planche gratuite. */
export const secretDp = secretPlanche;

export function lireContact(e: EntreeDp, secret: string): ContactDp | null {
  const t = dechiffrer(e.contact, secret);
  try {
    return t ? (JSON.parse(t) as ContactDp) : null;
  } catch {
    return null;
  }
}

/** Lien de suivi complet du client (jeton déchiffré), ou la page sans jeton à défaut. */
export function suiviDuClient(e: EntreeDp, secret: string): string {
  const k = dechiffrer(e.jetonChiffre, secret);
  return k ? lienSuivi(e.id, k) : `${site.url}/dp-piscine/suivi?id=${e.id}`;
}

/** Dossier du client : identifiant et jeton du lien de suivi vérifiés. */
export async function dossierDuClient(id: string, k: string): Promise<{ e: EntreeDp; secret: string } | null> {
  const secret = secretDp();
  if (!secret || !id || !k) return null;
  const e = await lireDp(id, secret);
  return e && jetonValide(e, k) ? { e, secret } : null;
}

/** Un e-mail qui ne part pas ne doit jamais faire échouer le parcours du client. */
export async function envoyer(quoi: string, f: () => Promise<unknown>) {
  try {
    await f();
  } catch (err) {
    console.error(`[dp-piscine] ${quoi} non envoyé`, err);
  }
}

/** Le dossier peut-il être payé ? (dossier produit, sans échec bloquant ou validé par ID Maîtrise) */
export const payable = (e: EntreeDp) =>
  Boolean(e.fichiers?.dossier && e.fichiers?.cerfa) && (e.statut === "pret" || e.statut === "a_verifier" || e.valideParIdm === true);

/** Paiement reçu : le dossier est débloqué, le client et ID Maîtrise prévenus. */
export async function marquerPaye(e: EntreeDp, secret: string, k: string, mode: "qonto" | "test"): Promise<EntreeDp> {
  const maj = (await majDp(e.id, secret, { paye: { le: Date.now(), mode } })) ?? e;
  const c = lireContact(maj, secret);
  if (c) {
    const suivi = lienSuivi(e.id, k);
    await envoyer("e-mail de paiement", () => sendToClient({ to: c.email, ...emailClientPaye(c, suivi) }));
    await envoyer("alerte de paiement", () =>
      sendInternal({ ...emailInterne(mode === "test" ? "Paiement TEST" : "Payé", c, maj, `${site.url}/dp-piscine/suivi?id=${e.id}`), replyTo: c.email }),
    );
  }
  return maj;
}

/** Lien Qonto en cours : on demande à Qonto s'il a été payé. */
export async function verifierPaiement(e: EntreeDp, secret: string, k: string): Promise<EntreeDp> {
  if (e.paye || !e.paiement) return e;
  try {
    const lien = await lireLienPaiement(await ouvrirQonto(), e.paiement.lienId);
    if (lien.status === "paid") return marquerPaye(e, secret, k, "qonto");
  } catch (err) {
    console.error("[dp-piscine] statut du paiement illisible", err);
  }
  return e;
}

/** Ce que le client voit de son dossier (jamais les adresses des fichiers avant paiement). */
export function vueClient(e: EntreeDp) {
  return {
    statut: e.statut,
    reference: e.reference,
    commune: e.commune,
    resume: e.resume ?? null,
    apercus: e.apercus ?? [],
    guide: e.paye ? (e.guide ?? "") : "",
    payable: payable(e),
    paye: Boolean(e.paye),
    paiementEnCours: Boolean(e.paiement && !e.paye),
    urlPaiement: e.paiement && !e.paye ? e.paiement.url : null,
    erreur: e.statut === "echec" ? "La préparation a rencontré un problème : nous reprenons votre dossier à la main." : null,
  };
}
