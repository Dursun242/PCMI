import { site } from "@/config/site";
import { clientWrap, esc, section, table } from "@/lib/mailer";
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
const lien = (path: string, texte: string) =>
  `<a href="${esc(site.url + path)}" style="color:#1b1f1d;text-decoration:underline">${esc(texte)}</a>`;

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
  return `ID-Maitrise_${propre(PLANCHES[x.planche].titre)}_${propre(x.commune)}_${propre(x.reference)}.pdf`;
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
    html: clientWrap(`
      <p>Bonjour ${esc(c.prenom)},</p>
      <p>Voici votre planche <strong>« ${esc(titre)} »</strong> pour la parcelle ${esc(x.reference)} à ${esc(x.commune)}, en pièce jointe, au format A3.</p>
      <p>Il est établi d'après le cadastre et les données de l'IGN : il vous sert à préparer votre projet et à en parler avec la mairie, un constructeur ou un artisan. Il ne remplace pas un plan de géomètre.</p>
      <p>Pour la suite, nous montons votre dossier de permis de construire complet, pièces PCMI 1 à 8, à prix fixe et payable en plusieurs fois : ${lien("/tarifs", "voir les formules")}. Une question sur votre terrain ? Répondez simplement à cet e-mail.</p>`),
  };
}

/** Accusé de réception envoyé au visiteur dès sa demande, avant la planche elle-même. */
export function emailClientAccuse(c: ContactPlanche, x: ContextePlanche, manuel: boolean) {
  const titre = PLANCHES[x.planche].titre;
  return {
    subject: `Votre demande de plan gratuit est bien reçue — ${x.commune}`,
    html: clientWrap(`
      <p>Bonjour ${esc(c.prenom)},</p>
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
      }</p>
      <p>Vous préparez un projet sur ce terrain ? Nous montons le dossier de permis de construire complet, pièces PCMI 1 à 8, à prix fixe et payable en plusieurs fois : ${lien("/tarifs", "voir les formules")}. Une question ? Répondez simplement à cet e-mail.</p>`),
  };
}

export function emailClientEchec(c: ContactPlanche, x: ContextePlanche) {
  const titre = PLANCHES[x.planche].titre;
  return {
    subject: `Votre planche gratuite arrive : ${titre.toLowerCase()} — ${x.commune}`,
    html: clientWrap(`
      <p>Bonjour ${esc(c.prenom)},</p>
      <p>Votre planche « ${esc(titre)} » pour la parcelle ${esc(x.reference)} à ${esc(x.commune)} demande une vérification de notre part : nous la finalisons nous-mêmes et vous l'envoyons sous 24 h ouvrées.</p>
      <p>Vous n'avez rien à refaire. Une précision sur votre terrain ? Répondez à cet e-mail.</p>`),
  };
}
