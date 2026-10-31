import "server-only";
import { validerCommande, type Commande } from "@/lib/commande";
import { signerJeton, verifierJeton, type DonneesCommande } from "@/lib/jetonCommande";
import type { CommandeQonto } from "@/lib/qonto";

/**
 * Le jeton de commande est signé avec une clé dérivée du secret de
 * l'application Qonto : pas de variable de plus à gérer, et un secret qui
 * change invalide les liens en cours, ce qui est le comportement voulu.
 */
const secret = () => process.env.QONTO_CLIENT_SECRET ?? process.env.QONTO_SECRET_KEY ?? "";

/** Jeton à placer dans le lien de signature, une fois la commande créée chez Qonto. */
export function jetonPour(commande: Commande, qonto: CommandeQonto, options: Record<string, number>): string {
  const { surface, ...coordonnees } = commande.coordonnees;
  const donnees: DonneesCommande = {
    clientId: qonto.clientId,
    devisId: qonto.devisId,
    mandatId: qonto.mandatId,
    selection: { formule: commande.panier.formule, options },
    echeances: commande.echeancier.nombre,
    coordonnees: { ...coordonnees, surface: String(surface) },
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

/** Options retenues par le panier, réduites aux quantités non nulles. */
export function optionsRetenues(panier: unknown): Record<string, number> {
  const options = typeof panier === "object" && panier !== null ? (panier as { options?: unknown }).options : undefined;
  if (typeof options !== "object" || options === null) return {};
  return Object.fromEntries(Object.entries(options).filter((e): e is [string, number] => typeof e[1] === "number" && e[1] > 0));
}
