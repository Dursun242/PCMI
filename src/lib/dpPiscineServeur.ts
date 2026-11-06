import "server-only";
import { cookies } from "next/headers";
import { site } from "@/config/site";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
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

/** Administrateur connecté sur /admin (cookie de session). */
export async function estAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Dossier du client : identifiant et jeton du lien de suivi vérifiés.
 * L'administrateur connecté ouvre tout dossier sans le jeton (lien des e-mails internes).
 */
export async function dossierDuClient(id: string, k: string): Promise<{ e: EntreeDp; secret: string; admin: boolean } | null> {
  const secret = secretDp();
  if (!secret || !id) return null;
  const e = await lireDp(id, secret);
  if (!e) return null;
  const admin = await estAdmin();
  return (k && jetonValide(e, k)) || admin ? { e, secret, admin } : null;
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
export async function marquerPaye(e: EntreeDp, secret: string, mode: "qonto" | "test"): Promise<EntreeDp> {
  const maj = (await majDp(e.id, secret, { paye: { le: Date.now(), mode } })) ?? e;
  const c = lireContact(maj, secret);
  if (c) {
    const suivi = suiviDuClient(maj, secret);
    await envoyer("e-mail de paiement", () => sendToClient({ to: c.email, ...emailClientPaye(c, suivi) }));
    await envoyer("alerte de paiement", () =>
      sendInternal({ ...emailInterne(mode === "test" ? "Paiement TEST" : "Payé", c, maj, suivi), replyTo: c.email }),
    );
  }
  return maj;
}

/** Lien Qonto en cours : on demande à Qonto s'il a été payé. */
export async function verifierPaiement(e: EntreeDp, secret: string): Promise<EntreeDp> {
  if (e.paye || !e.paiement) return e;
  try {
    const lien = await lireLienPaiement(await ouvrirQonto(), e.paiement.lienId);
    if (lien.status === "paid") return marquerPaye(e, secret, "qonto");
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
