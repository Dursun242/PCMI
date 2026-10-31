import { site } from "@/config/site";
import { DELAI_RETRACTATION_JOURS, ficheFacturation, mentionFacturation, type Commande } from "@/lib/commande";
import { clientWrap, esc, section, table } from "@/lib/mailer";

/**
 * Contenu des e-mails de la commande en ligne, une fois le devis accepté et
 * le mandat signé : confirmation au client et fiche interne.
 */

const lien = (url: string, texte: string) => `<a href="${esc(url)}" style="color:#1b1f1d">${esc(texte)}</a>`;

export interface Email {
  subject: string;
  html: string;
}

export interface DevisSigne {
  numero: string;
  url: string;
}

/** Confirmation au client : devis signé, CGV et formulaire de rétractation (support durable), et la suite. */
export function emailConfirmationClient(commande: Commande, devis: DevisSigne, pdfJoint = false): Email {
  const { coordonnees: c, echeancier } = commande;
  const devisSigne = pdfJoint
    ? `Votre devis signé n° ${esc(devis.numero)}, joint à cet e-mail en PDF (${lien(devis.url, "également consultable en ligne")})`
    : lien(devis.url, `Votre devis signé n° ${devis.numero}`);
  return {
    subject: `Votre commande est confirmée — ${site.name}`,
    html: clientWrap(`
      <p>Bonjour ${esc(c.prenom)},</p>
      <p>Votre commande de permis de construire pour le terrain <strong>${esc(c.terrainAdresse)}, ${esc(c.terrainCommune)}</strong> est signée. Merci de votre confiance.</p>
      <p><strong>Et maintenant ?</strong> Nous lisons le règlement d'urbanisme de votre commune pour confirmer que le permis peut être déposé, puis nous vous confirmons le démarrage par e-mail. Si le permis n'est pas possible, nous annulons tout : rien n'est facturé ni prélevé.</p>
      <p>${esc(mentionFacturation(echeancier))}</p>
      ${section("Vos documents", `<ul style="padding-left:18px">
        <li>${devisSigne}</li>
        <li>${lien(`${site.url}/cgv`, "Les conditions générales de vente")}, dont le formulaire de rétractation (article 8)</li>
      </ul>`)}
      <p style="font-size:14px;color:#5a645e">Vous pouvez vous rétracter pendant ${DELAI_RETRACTATION_JOURS} jours à compter d'aujourd'hui, sans frais ni justification, en répondant simplement à cet e-mail.</p>
    `),
  };
}

export interface PreuveSignature {
  /** Instant de la signature, ISO 8601. */
  instant: string;
  ip: string;
  navigateur: string;
  executionAnticipee: boolean;
}

export interface MandatSigne {
  iban: string;
  reference: string;
}

/** Fiche interne : tout ce qu'il faut pour vérifier le terrain puis lancer la facturation dans Qonto. */
export function emailNouvelleCommande(
  commande: Commande,
  devis: DevisSigne,
  mandat: MandatSigne,
  preuve: PreuveSignature,
  jourSignature: string,
  pdfJoint = false,
): Email {
  const { coordonnees: c, panier } = commande;
  const signeLe = new Date(preuve.instant).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  return {
    subject: `Commande signée — ${c.prenom} ${c.nom} — ${c.terrainCommune} — ${panier.lignes[0].libelle}`,
    html: `
      <h2 style="font-family:Lato,Arial,sans-serif">Nouvelle commande signée</h2>
      ${section("Le terrain à vérifier", table([
        ["Adresse", `${c.terrainAdresse}, ${c.terrainCodePostal} ${c.terrainCommune}`],
        ["Référence cadastrale", c.referenceCadastrale],
        ["Surface de plancher", `${c.surface} m²`],
      ]))}
      ${section("À lancer dans Qonto après validation du terrain", table(ficheFacturation(commande, jourSignature, devis.numero)))}
      ${section("Client", table([
        ["Nom", `${c.prenom} ${c.nom}`],
        ["E-mail", c.email],
        ["Téléphone", c.telephone],
        ["Adresse", `${c.adresse}, ${c.codePostal} ${c.ville}`],
      ]))}
      ${section("Signature", table([
        ["Devis", `n° ${devis.numero}${pdfJoint ? " (PDF joint)" : ""}`],
        ["Mandat SEPA", `${mandat.reference} · IBAN ${mandat.iban}`],
        ["Signée le", signeLe],
        ["Exécution anticipée demandée", preuve.executionAnticipee ? "Oui" : "Non"],
        ["Adresse IP", preuve.ip],
        ["Navigateur", preuve.navigateur],
      ]))}
      <p style="font-family:Lato,Arial,sans-serif;font-size:14px"><a href="${esc(devis.url)}">Voir le devis dans Qonto</a></p>
      <p style="font-family:Lato,Arial,sans-serif;font-size:13px;color:#8593a8">Si le terrain ne permet pas le permis : annuler le mandat et le devis dans Qonto, puis prévenir le client. Rien n'a été facturé.</p>
    `,
  };
}
