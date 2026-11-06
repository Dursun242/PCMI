import { site } from "@/config/site";
import { clientWrap, esc, section, table } from "@/lib/mailer";
import { PRIX_DP_PISCINE_TTC } from "@/lib/dpPiscine";
import type { EntreeDp } from "@/lib/dpPiscineStore";

/** E-mails de la DP piscine en ligne. Fonctions pures : les routes ne font que les envoyer. */

export interface ContactDp {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}

const FONT = "font-family:Lato,Arial,sans-serif";

export const lienSuivi = (id: string, k: string) => `${site.url}/dp-piscine/suivi?${new URLSearchParams({ id, k })}`;

const bouton = (url: string, texte: string) =>
  `<p><a href="${esc(url)}" style="${FONT};display:inline-block;padding:12px 20px;font-size:15px;font-weight:700;text-decoration:none;background:#1b1f1d;color:#fff">${esc(texte)}</a></p>`;

export function emailClientDemarre(c: ContactDp, e: Pick<EntreeDp, "reference" | "commune">, suivi: string) {
  return {
    subject: `Votre déclaration de piscine est en préparation (${e.commune})`,
    html: clientWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
       <p>Nous dessinons votre dossier de déclaration préalable pour la piscine de la parcelle ${esc(e.reference)} (${esc(e.commune)}) :
       plan de situation, plan de masse coté, plan en coupe et Cerfa 13703 pré-rempli. Comptez 3 minutes.</p>
       ${bouton(suivi, "Suivre mon dossier")}
       <p style="color:#5a645e;font-size:14px">Gardez ce lien : il vous permet de revenir à votre dossier à tout moment.</p>`,
    ),
  };
}

export function emailClientPret(c: ContactDp, e: Pick<EntreeDp, "reference" | "commune">, suivi: string) {
  return {
    subject: "L'aperçu de votre déclaration de piscine est prêt",
    html: clientWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
       <p>Votre dossier de déclaration préalable (parcelle ${esc(e.reference)}, ${esc(e.commune)}) est prêt. Regardez l'aperçu
       des plans ; si tout vous convient, réglez ${PRIX_DP_PISCINE_TTC} € TTC et téléchargez le dossier complet, prêt à déposer.</p>
       ${bouton(suivi, "Voir l'aperçu de mon dossier")}`,
    ),
  };
}

export function emailClientVerification(c: ContactDp, e: Pick<EntreeDp, "reference" | "commune">) {
  return {
    subject: "Votre déclaration de piscine : une vérification de notre part",
    html: clientWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
       <p>Votre terrain (parcelle ${esc(e.reference)}, ${esc(e.commune)}) demande une vérification par notre bureau d'études avant de
       finaliser le dossier (secteur protégé, photos nécessaires, recul à confirmer…). Nous revenons vers vous sous 24 h ouvrées.</p>
       <p>Rien n'est à régler pour le moment.</p>`,
    ),
  };
}

export function emailClientPaye(c: ContactDp, suivi: string) {
  return {
    subject: "Votre déclaration de piscine : dossier à télécharger",
    html: clientWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
       <p>Merci pour votre règlement. Votre dossier complet est disponible : les plans (DP1, DP2, DP3) et le Cerfa 13703 pré-rempli,
       à vérifier, dater et signer avant le dépôt en mairie.</p>
       ${bouton(suivi, "Télécharger mon dossier")}
       <p>Le dépôt se fait en ligne sur le guichet numérique de votre commune, ou en mairie en deux exemplaires. Délai
       d'instruction : 1 mois (2 mois en secteur protégé).</p>`,
    ),
  };
}

export function emailInterne(objet: string, c: ContactDp, e: EntreeDp, suivi: string, detail = "") {
  return {
    subject: `[DP piscine] ${objet} — ${c.prenom} ${c.nom} (${e.commune})`,
    html: `<div style="${FONT};font-size:15px">${table([
      ["Client", `${c.prenom} ${c.nom}`],
      ["E-mail", c.email],
      ["Téléphone", c.telephone],
      ["Parcelle", `${e.reference} (${e.commune})`],
      ["Statut", e.statut],
      ["Payé", e.paye ? `oui (${e.paye.mode})` : "non"],
    ])}${section("Suivi", `<p><a href="${esc(suivi)}">${esc(suivi)}</a></p>`)}${
      e.resume
        ? section(
            "Contrôles",
            `<p>${esc(e.resume.motifRegime)}</p><ul>${[...e.resume.echecs, ...e.resume.aVerifier]
              .map((x) => `<li>${esc(x)}</li>`)
              .join("")}</ul>`,
          )
        : ""
    }${detail ? section("Détail", `<pre style="white-space:pre-wrap;font-size:12px">${esc(detail)}</pre>`) : ""}</div>`,
  };
}
