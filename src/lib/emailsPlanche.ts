import { plans, site } from "@/config/site";
import { formatEuro } from "@/lib/format";
import { esc, section, table } from "@/lib/mailer";
import { PLANCHES, type Planche } from "@/lib/planche";

/**
 * E-mails de la planche gratuite. Fonctions pures (testées) : l'API ne fait
 * que les envoyer.
 */

export interface ContactPlanche {
  prenom: string;
  nom: string;
  email: string;
}

export interface ContextePlanche {
  planche: Planche;
  reference: string;
  commune: string;
  adresse: string;
}

const FONT = "font-family:Lato,Arial,sans-serif";
const DOMAINE = site.url.replace(/^https?:\/\//, "");

/** Lien vers le site, marqué pour la mesure (nomenclature utm du site : minuscules, sans accent). */
export function lienSite(path: string, contenu: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${site.url}${path}${sep}utm_source=email&utm_medium=planche-gratuite&utm_campaign=${contenu}`;
}

const lien = (path: string, texte: string, contenu: string) =>
  `<a href="${esc(lienSite(path, contenu))}" style="color:#1b1f1d;text-decoration:underline">${esc(texte)}</a>`;

const bouton = (path: string, texte: string, contenu: string, plein = true) =>
  `<a href="${esc(lienSite(path, contenu))}" style="${FONT};display:inline-block;margin:4px 8px 4px 0;padding:12px 20px;font-size:15px;font-weight:700;text-decoration:none;${
    plein ? "background:#1b1f1d;color:#fcfbf9;border:1px solid #1b1f1d" : "background:#fcfbf9;color:#1b1f1d;border:1px solid #1b1f1d"
  }">${esc(texte)}</a>`;

/**
 * Habillage des e-mails envoyés au visiteur : tout renvoie au site (Dursun,
 * 02/11/2026 : « le but du jeu est que le site soit promu »). Pas de
 * signature personnelle : le site, ses formules et ses plans gratuits.
 */
export function siteWrap(inner: string, campagne: string): string {
  const prix = formatEuro(plans[0].priceTTC);
  return `<div style="${FONT};font-size:16px;line-height:1.6;color:#1b1f1d;max-width:560px">
    <p style="margin:0 0 18px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#82663a;font-weight:700">Permis de construire en ligne</p>
    <p style="margin:0 0 24px"><a href="${esc(lienSite("/", `${campagne}-entete`))}" style="font-size:22px;font-weight:700;color:#1b1f1d;text-decoration:none">${esc(DOMAINE)}</a></p>
    ${inner}
    <div style="margin:28px 0;padding:20px 22px;background:#f2f0eb;border-left:3px solid #a9884f">
      <p style="margin:0 0 6px;font-weight:700;font-size:17px">Votre permis de maison, à prix fixe, dès ${esc(prix)} TTC</p>
      <p style="margin:0 0 14px;color:#5a645e;font-size:15px">Dossier complet PCMI 1 à 8, prêt à déposer en mairie. Devis immédiat, paiement en 1, 4 ou 10 fois sans frais.</p>
      ${bouton("/commander", "Mon devis immédiat", `${campagne}-devis`)}${bouton("/tarifs", "Voir les formules", `${campagne}-tarifs`, false)}
    </div>
    <p style="font-size:15px">Un proche a un terrain ? Le plan gratuit est pour lui aussi : ${lien("/plans-gratuits", DOMAINE + "/plans-gratuits", `${campagne}-partage`)}</p>
    <p style="margin-top:28px;font-size:13px;color:#5a645e">${esc(DOMAINE)} · le permis de construire de votre maison, en ligne<br>Une question ? Répondez simplement à cet e-mail.</p>
  </div>`;
}

const lignes = (c: ContactPlanche, x: ContextePlanche): [string, string][] => [
  ["Nom", `${c.prenom} ${c.nom}`],
  ["E-mail", c.email],
  ["Planche", PLANCHES[x.planche].titre],
  ["Terrain", x.adresse],
  ["Parcelle", `${x.reference} (${x.commune})`],
];

/** Nom du fichier joint : lisible et sans caractère spécial. */
export function nomFichierPlanche(x: Pick<ContextePlanche, "planche" | "reference" | "commune">): string {
  const propre = (t: string) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `permis-maison-individuelle_${propre(PLANCHES[x.planche].titre)}_${propre(x.commune)}_${propre(x.reference)}.pdf`;
}

/** `cause` : pourquoi la planche n'est pas partie toute seule ; null si elle est lancée. */
export function emailInterneDemande(c: ContactPlanche, x: ContextePlanche, cause: string | null) {
  const manuel = cause !== null;
  return {
    subject: `Planche gratuite${manuel ? " À FAIRE À LA MAIN" : ""} — ${c.prenom} ${c.nom} — ${x.commune}`,
    html: `<h2 style="${FONT}">Nouvelle demande de planche gratuite</h2>
      ${table(lignes(c, x))}
      <p style="${FONT}">${
        manuel
          ? "<strong>La planche n'a pas pu être lancée automatiquement.</strong> Prépare-la à la main et envoie-la au visiteur : il a été prévenu d'un envoi sous 24 h ouvrées."
          : "La planche est en cours de dessin : elle partira toute seule au visiteur, tu en recevras une copie."
      }</p>
      ${manuel ? section("Cause", `<pre style="white-space:pre-wrap;font-size:12px">${esc(cause.slice(0, 600))}</pre>`) : ""}
      <p style="${FONT};color:#5a645e">Un prospect qui prépare un projet sur ce terrain : bon moment pour le rappeler.</p>`,
  };
}

export function emailInterneRefus(c: ContactPlanche, x: ContextePlanche) {
  return {
    subject: `Planche gratuite refusée (parcelle déjà servie) — ${c.prenom} ${c.nom} — ${x.commune}`,
    html: `<h2 style="${FONT}">Deuxième demande sur une même parcelle</h2>
      ${table(lignes(c, x))}
      <p style="${FONT}">La parcelle a déjà eu sa planche gratuite : la demande a été refusée et le visiteur invité à vous contacter. Son contact reste utile.</p>`,
  };
}

export function emailInterneLivree(c: ContactPlanche, x: ContextePlanche) {
  return {
    subject: `Planche gratuite envoyée — ${c.prenom} ${c.nom} — ${x.commune}`,
    html: `<h2 style="${FONT}">Planche gratuite envoyée</h2>${table(lignes(c, x))}<p style="${FONT}">Copie jointe.</p>`,
  };
}

export function emailInterneEchec(c: ContactPlanche, x: ContextePlanche, erreur: string) {
  return {
    subject: `Planche gratuite EN ÉCHEC, à faire à la main — ${c.prenom} ${c.nom} — ${x.commune}`,
    html: `<h2 style="${FONT}">La planche n'a pas pu être dessinée</h2>
      ${table(lignes(c, x))}
      ${section("Erreur", `<pre style="white-space:pre-wrap;font-size:12px">${esc(erreur.slice(0, 1500))}</pre>`)}
      <p style="${FONT}">Le visiteur a été prévenu d'un envoi sous 24 h ouvrées : prépare la planche avec l'état existant (outils/existant.py) et réponds-lui.</p>`,
  };
}

export function emailClientPlanche(c: ContactPlanche, x: ContextePlanche) {
  const titre = PLANCHES[x.planche].titre;
  return {
    subject: `Votre planche gratuite : ${titre.toLowerCase()} — ${x.commune}`,
    html: siteWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
      <p>Voici votre planche <strong>« ${esc(titre)} »</strong> pour la parcelle ${esc(x.reference)} à ${esc(x.commune)}, en pièce jointe, au format A3.</p>
      <p>Elle est établie d'après le cadastre et les données de l'IGN : elle vous sert à préparer votre projet et à en parler avec la mairie, un constructeur ou un artisan. Elle ne remplace pas un plan de géomètre.</p>`,
      "livraison",
    ),
  };
}

/** Accusé de réception envoyé au visiteur dès sa demande, avant la planche elle-même. */
export function emailClientAccuse(c: ContactPlanche, x: ContextePlanche, manuel: boolean) {
  const titre = PLANCHES[x.planche].titre;
  return {
    subject: `Votre demande de plan gratuit est bien reçue — ${x.commune}`,
    html: siteWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
      <p>Merci pour votre demande. Nous avons bien reçu :</p>
      ${table([
        ["Plan demandé", titre],
        ["Terrain", x.adresse],
        ["Parcelle", `${x.reference} (${x.commune})`],
      ])}
      <p>${
        manuel
          ? "Votre terrain demande une vérification de notre part : nous finalisons la planche nous-mêmes et vous l'envoyons par e-mail sous 24 h ouvrées."
          : "Notre outil est en train de la dessiner : vous la recevrez par e-mail d'ici quelques minutes, en PDF au format A3. Pensez à regarder dans vos courriers indésirables."
      }</p>`,
      "accuse",
    ),
  };
}

export function emailClientEchec(c: ContactPlanche, x: ContextePlanche) {
  const titre = PLANCHES[x.planche].titre;
  return {
    subject: `Votre planche gratuite arrive : ${titre.toLowerCase()} — ${x.commune}`,
    html: siteWrap(
      `<p>Bonjour ${esc(c.prenom)},</p>
      <p>Votre planche « ${esc(titre)} » pour la parcelle ${esc(x.reference)} à ${esc(x.commune)} demande une vérification de notre part : nous la finalisons nous-mêmes et vous l'envoyons sous 24 h ouvrées.</p>
      <p>Vous n'avez rien à refaire.</p>`,
      "attente",
    ),
  };
}
