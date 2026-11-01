import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Secrets de la planche gratuite : empreinte de la parcelle (le registre ne
 * contient aucune référence lisible), signature de l'adresse de rappel donnée
 * à GitHub, et chiffrement des coordonnées du visiteur dans le registre.
 *
 * Clé : PLANCHE_SECRET, à défaut ADMIN_SESSION_SECRET (déjà posé pour /admin).
 */

/** Durée de validité de l'adresse de rappel : une planche se dessine en 1 à 2 minutes. */
export const VALIDITE_RAPPEL_MS = 60 * 60 * 1000;

export function secretPlanche(): string | null {
  return process.env.PLANCHE_SECRET || process.env.ADMIN_SESSION_SECRET || null;
}

function cle(secret: string, usage: string): Buffer {
  return createHash("sha256").update(`${usage}:${secret}`).digest();
}

/** Empreinte de la parcelle : même parcelle, même empreinte ; impossible à deviner sans le secret. */
export function empreinteParcelle(idu: string, secret: string): string {
  return createHmac("sha256", cle(secret, "parcelle")).update(idu.toUpperCase()).digest("hex").slice(0, 40);
}

const charge = (id: string, empreinte: string, expire: number) => `${id}.${empreinte}.${expire}`;

export function signerRappel(id: string, empreinte: string, expire: number, secret: string): string {
  return createHmac("sha256", cle(secret, "rappel")).update(charge(id, empreinte, expire)).digest("hex");
}

/** Vrai si la signature correspond et que l'adresse n'a pas expiré. */
export function verifierRappel(
  p: { id: string; empreinte: string; expire: number; signature: string },
  secret: string,
  maintenant = Date.now(),
): boolean {
  if (!Number.isFinite(p.expire) || p.expire < maintenant) return false;
  const attendue = Buffer.from(signerRappel(p.id, p.empreinte, p.expire, secret), "hex");
  const recue = Buffer.from(/^[0-9a-f]{64}$/.test(p.signature) ? p.signature : "", "hex");
  return recue.length === attendue.length && timingSafeEqual(recue, attendue);
}

/** Chiffre un texte (AES-256-GCM) : « iv.tag.données », en base64url. */
export function chiffrer(texte: string, secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cle(secret, "contact"), iv);
  const donnees = Buffer.concat([c.update(texte, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), donnees].map((b) => b.toString("base64url")).join(".");
}

/** Déchiffre ; null si le texte a été altéré ou chiffré avec une autre clé. */
export function dechiffrer(chiffre: string, secret: string): string | null {
  try {
    const [iv, tag, donnees] = chiffre.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", cle(secret, "contact"), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(donnees), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
