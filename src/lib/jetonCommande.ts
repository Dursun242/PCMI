import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { SIGNATURE } from "@/lib/commande";

/**
 * Jeton de commande : ce que le site doit retrouver entre la saisie de l'IBAN
 * et la signature, sans base de données. La commande voyage dans le lien
 * envoyé par e-mail, signée (HMAC-SHA256) pour qu'on ne puisse ni la modifier
 * ni la forger, et datée pour expirer avec le lien.
 *
 * Seuls des choix et des identifiants y figurent : les prix sont toujours
 * recalculés depuis la configuration, l'IBAN reste chez Qonto.
 */
export interface DonneesCommande {
  clientId: string;
  devisId: string;
  mandatId: string;
  /** Formule et options, telles que validées par calculerPanier. */
  selection: { formule: string; options: Record<string, number> };
  echeances: number;
  /** Coordonnées du client et du terrain, en texte (relues par validerCoordonnees). */
  coordonnees: Record<string, string>;
}

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Clé propre aux jetons, dérivée du secret : la même valeur ne sert jamais à deux usages. */
const cle = (secret: string) => createHash("sha256").update(`pcmi-commande:${secret}`).digest();

const signature = (charge: string, secret: string) => createHmac("sha256", cle(secret)).update(charge).digest("base64url");

export function signerJeton(
  donnees: DonneesCommande,
  secret: string,
  maintenant: number = Date.now(),
  dureeJours: number = SIGNATURE.validiteJours,
): string {
  if (!secret) throw new Error("Clé de signature des commandes absente.");
  const charge = Buffer.from(JSON.stringify({ ...donnees, exp: maintenant + dureeJours * JOUR_MS })).toString("base64url");
  return `${charge}.${signature(charge, secret)}`;
}

/** La commande portée par le jeton, ou null s'il est illisible, falsifié ou expiré. */
export function verifierJeton(jeton: unknown, secret: string, maintenant: number = Date.now()): DonneesCommande | null {
  if (typeof jeton !== "string" || !secret) return null;
  const [charge, signe] = jeton.split(".");
  if (!charge || !signe) return null;

  const attendu = Buffer.from(signature(charge, secret));
  const recu = Buffer.from(signe);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;

  try {
    const { exp, ...donnees } = JSON.parse(Buffer.from(charge, "base64url").toString("utf8"));
    if (typeof exp !== "number" || exp < maintenant) return null;
    return donnees as DonneesCommande;
  } catch {
    return null;
  }
}
