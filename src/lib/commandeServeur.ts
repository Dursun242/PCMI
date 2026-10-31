import "server-only";
import { validerCommande, type Commande } from "@/lib/commande";
import { dejaFinalisee, marquerFinalisee } from "@/lib/commandesFinalisees";
import { emailConfirmationClient, emailNouvelleCommande } from "@/lib/emailsCommande";
import { signerJeton, verifierJeton, type DonneesCommande, type PreuveAcceptation } from "@/lib/jetonCommande";
import { sendPair } from "@/lib/mailer";
import { lireDevis, lireMandat, pdfDevis, type CommandeQonto, type ConfigQonto } from "@/lib/qonto";
import { jourParis } from "@/lib/suivi";

/**
 * Le jeton de commande est signé avec une clé dérivée du secret de
 * l'application Qonto : pas de variable de plus à gérer, et un secret qui
 * change invalide les liens en cours, ce qui est le comportement voulu.
 */
const secret = () => process.env.QONTO_CLIENT_SECRET ?? process.env.QONTO_SECRET_KEY ?? "";

/** Jeton à placer dans le lien de signature, une fois la commande créée chez Qonto. */
export function jetonPour(commande: Commande, qonto: CommandeQonto, options: Record<string, number>, ads = false): string {
  const { surface, ...coordonnees } = commande.coordonnees;
  const donnees: DonneesCommande = {
    clientId: qonto.clientId,
    devisId: qonto.devisId,
    mandatId: qonto.mandatId,
    selection: { formule: commande.panier.formule, options },
    echeances: commande.echeancier.nombre,
    coordonnees: { ...coordonnees, surface: String(surface) },
    ...(ads ? { ads: true } : {}),
  };
  return signerJeton(donnees, secret());
}

export interface CommandeSignable {
  donnees: DonneesCommande;
  commande: Commande;
}

/** Commande retrouvée depuis un jeton, revérifiée comme à la commande ; null si le lien est invalide ou expiré. */
export function commandeDuJeton(jeton: unknown): CommandeSignable | null {
  const donnees = verifierJeton(jeton, secret());
  if (!donnees) return null;
  const r = validerCommande({ panier: donnees.selection, coordonnees: donnees.coordonnees, echeances: donnees.echeances });
  return r.ok ? { donnees, commande: r.commande } : null;
}

/** Nouveau jeton, portant la preuve d'acceptation du devis. */
export function jetonAccepte(donnees: DonneesCommande, acceptation: PreuveAcceptation): string {
  return signerJeton({ ...donnees, acceptation }, secret());
}

/** `premiere` : faux si la commande était déjà confirmée (autre onglet, double clic). */
export type ResultatFinalisation = { ok: true; premiere: boolean } | { ok: false; raison: "devis-non-accepte" | "mandat-non-signe" };

/**
 * Finalise une commande dont le devis est accepté et le mandat signé : le
 * client reçoit sa confirmation avec le devis signé en PDF (support durable),
 * l'administrateur sa fiche (terrain à vérifier, facturation, preuve).
 */
export async function finaliserCommande(signable: CommandeSignable, cfg: ConfigQonto): Promise<ResultatFinalisation> {
  const { donnees, commande } = signable;
  if (!donnees.acceptation) return { ok: false, raison: "devis-non-accepte" };
  const [devis, mandat] = await Promise.all([lireDevis(cfg, donnees.devisId), lireMandat(cfg, donnees.mandatId)]);
  if (!mandat.signe) return { ok: false, raison: "mandat-non-signe" };
  // Déjà confirmée (autre onglet, double clic) : rien à renvoyer.
  if (await dejaFinalisee(donnees.mandatId)) return { ok: true, premiere: false };
  const oterMarque = await marquerFinalisee(donnees.mandatId);

  // Le devis signé en PDF, joint aux deux e-mails ; à défaut, ils portent le lien vers le devis.
  const pdf = await pdfDevis(cfg, devis.pieceJointeId);
  const pieces = pdf ? [{ filename: `Devis-${devis.numero}-signe.pdf`, content: pdf.contenu }] : undefined;
  const jourSignature = jourParis(new Date(donnees.acceptation.instant));
  const interne = emailNouvelleCommande(commande, devis, mandat, donnees.acceptation, jourSignature, Boolean(pdf));
  const client = emailConfirmationClient(commande, devis, Boolean(pdf));
  try {
    await sendPair({
      subject: interne.subject,
      internalHtml: interne.html,
      replyTo: commande.coordonnees.email,
      clientSubject: client.subject,
      clientHtml: client.html,
      attachments: pieces,
      clientAttachments: pieces,
    });
  } catch (err) {
    // E-mails non partis : la commande doit pouvoir être confirmée au prochain essai.
    await oterMarque().catch((e) => console.error("[commande] marque de finalisation non ôtée", e));
    throw err;
  }
  return { ok: true, premiere: true };
}

/** Options retenues par le panier, réduites aux quantités non nulles. */
export function optionsRetenues(panier: unknown): Record<string, number> {
  const options = typeof panier === "object" && panier !== null ? (panier as { options?: unknown }).options : undefined;
  if (typeof options !== "object" || options === null) return {};
  return Object.fromEntries(Object.entries(options).filter((e): e is [string, number] => typeof e[1] === "number" && e[1] > 0));
}
