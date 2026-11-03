import { siteWrap } from "@/lib/emailsPlanche";
import type { Analyse, DonneesTerrain } from "@/lib/ficheTerrain";
import { esc, table } from "@/lib/mailer";

/** E-mails de la fiche terrain. Fonctions pures (testées) : l'API ne fait que les envoyer. */

export interface ContactFiche {
  prenom: string;
  nom: string;
  email: string;
}

const FONT = "font-family:Lato,Arial,sans-serif";
const reference = (d: DonneesTerrain) => `${d.parcelle.section.replace(/^0/, "")} ${d.parcelle.numero}`;

/** Nom du fichier joint : lisible et sans caractère spécial. */
export function nomFichierFiche(d: DonneesTerrain): string {
  const propre = (t: string) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `permis-maison-individuelle_Fiche-terrain_${propre(d.parcelle.commune)}_${propre(reference(d))}.pdf`;
}

export function emailClientFiche(c: ContactFiche, d: DonneesTerrain, a: Analyse) {
  const alertes = a.voyants.filter((v) => v.niveau === "alerte").map((v) => v.titre.toLowerCase());
  const resume = alertes.length
    ? `Points d'alerte : <strong>${esc(alertes.join(", "))}</strong>. Le détail et ce qu'ils changent pour votre projet sont dans la fiche.`
    : "Aucun point d'alerte dans les données publiques : le détail et les précautions à prendre sont dans la fiche.";
  return {
    subject: `Votre fiche terrain : parcelle ${reference(d)}, ${d.parcelle.commune}`,
    html: siteWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
      <p>Voici la fiche de votre terrain, parcelle ${esc(reference(d))} à ${esc(d.parcelle.commune)}, en pièce jointe (PDF).</p>
      <p><strong>${esc(a.zone.titre)}</strong><br>${esc(a.zone.detail)}</p>
      <p>${resume}</p>
      <p style="color:#5a645e;font-size:14px">Fiche indicative établie d'après le Géoportail de l'urbanisme et Géorisques : seul un certificat d'urbanisme délivré par la mairie fait foi.</p>`,
      "fiche",
      "fiche-terrain",
    ),
  };
}

export function emailInterneFiche(c: ContactFiche, d: DonneesTerrain, a: Analyse, adresse: string | null) {
  const alertes = a.voyants.filter((v) => v.niveau === "alerte" || v.niveau === "vigilance");
  return {
    subject: `Fiche terrain — ${c.prenom} ${c.nom} — ${d.parcelle.commune} (${a.zone.titre.slice(0, 40)})`,
    html: `<h2 style="${FONT}">Nouvelle fiche terrain envoyée</h2>
      ${table([
        ["Nom", `${c.prenom} ${c.nom}`],
        ["E-mail", c.email],
        ["Terrain", adresse ?? ""],
        ["Parcelle", `${reference(d)} (${d.parcelle.commune}), ${d.parcelle.contenance.toLocaleString("fr-FR")} m²`],
        ["Zone", a.zone.titre],
        ["À surveiller", alertes.map((v) => `${v.titre} (${v.niveau})`).join(", ") || "rien de particulier"],
      ])}
      <p style="${FONT};color:#5a645e">Quelqu'un qui étudie un terrain, souvent avant l'achat : bon moment pour le rappeler. La fiche est jointe.</p>`,
  };
}
