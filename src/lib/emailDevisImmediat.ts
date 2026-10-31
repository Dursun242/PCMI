import { site, type Plan } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { formatCentimes, mensualites } from "@/lib/commande";
import { lienCommandeImmediate, mentionOffreLancement } from "@/lib/devisImmediat";
import { esc } from "@/lib/mailer";

/**
 * Le devis immédiat tel qu'il est repris dans l'e-mail au client : le prix vu
 * à l'écran, sa date limite s'il s'agit d'un prix d'offre, et le lien vers la
 * commande pré-remplie. Fichier serveur : il importe le module d'envoi.
 */
export function devisImmediatEmailHtml(plan: Plan, surface: string): string {
  const etalement = mensualites(plan.priceTTC)[0];
  const lien = `${site.url}${lienCommandeImmediate(plan.id, surface)}`;
  const offre = mentionOffreLancement(plan);
  return `
      <p>Votre devis : formule <strong>${esc(plan.name)}</strong>, <strong>${esc(formatEuro(plan.priceTTC))} TTC</strong>${
        etalement ? ` (ou ${etalement.nombre} × ${esc(formatCentimes(etalement.montantCentimes))} sans frais)` : ""
      }, dossier livré sous ${esc(plan.delayWorkingDays)}. Prix fixe, hors options que vous choisiriez d'ajouter.</p>
      ${offre ? `<p><strong>${esc(offre)}</strong></p>` : ""}
      <p><a href="${esc(lien)}" style="color:#10233f;font-weight:700">Commander au prix de ${esc(formatEuro(plan.priceTTC))}</a></p>
      <p>Nous lisons le règlement d'urbanisme de votre commune avant de lancer le dossier : s'il ne permet pas le permis, rien n'est facturé.</p>`;
}

/** Objet de l'e-mail au client quand le devis est immédiat. */
export function devisImmediatEmailSujet(plan: Plan): string {
  return `Votre devis : formule ${plan.name}, ${formatEuro(plan.priceTTC)} TTC — ${site.name}`;
}
