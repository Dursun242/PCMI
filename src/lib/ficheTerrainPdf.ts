import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import { plans, site } from "@/config/site";
import type { Analyse, DonneesTerrain, Niveau } from "@/lib/ficheTerrain";
import { formatEuro } from "@/lib/format";
import { cadrer, cheminSvg, urlFondOrtho } from "@/lib/planche";

/**
 * PDF de la fiche terrain : A4, deux pages, aux couleurs du site. Tout renvoie à
 * permis-maison-individuelle.fr (QR code, pied de page, encadré du devis),
 * comme les planches gratuites. Polices standard du PDF (aucun fichier à
 * embarquer) : le texte est ramené au jeu de caractères qu'elles savent écrire.
 */

const C = {
  encre: rgb(0.106, 0.122, 0.114),
  encre2: rgb(0.353, 0.392, 0.369),
  bronze: rgb(0.51, 0.4, 0.227),
  laiton: rgb(0.663, 0.533, 0.31),
  pierre: rgb(0.949, 0.941, 0.922),
  pierre2: rgb(0.894, 0.878, 0.843),
  alerte: rgb(0.639, 0.251, 0.173),
  vert: rgb(0.247, 0.42, 0.29),
  blanc: rgb(1, 1, 1),
};

export const COULEUR_NIVEAU: Record<Niveau, RGB> = {
  favorable: C.vert,
  info: rgb(0.42, 0.47, 0.44),
  vigilance: rgb(0.78, 0.55, 0.12),
  alerte: C.alerte,
  inconnu: rgb(0.6, 0.6, 0.6),
};

export const MOT_NIVEAU: Record<Niveau, string> = {
  favorable: "Favorable",
  info: "À savoir",
  vigilance: "Vigilance",
  alerte: "Alerte",
  inconnu: "Non connu",
};

const L = 595.28;
const H = 841.89;
const M = 46;
const LARGEUR = L - 2 * M;
const BAS = 62;
const DOMAINE = site.url.replace(/^https?:\/\//, "");

export const lienFiche = (path: string, contenu: string) =>
  `${site.url}${path}${path.includes("?") ? "&" : "?"}utm_source=fiche-terrain&utm_medium=pdf&utm_campaign=${contenu}`;

/** Ramène un texte aux caractères que la police standard sait écrire (jeu WinAnsi). */
export function texteSur(font: PDFFont, t: string): string {
  const remplace: Record<string, string> = { " ": " ", " ": " ", "≈": "~", "→": "->", "≥": ">=", "≤": "<=", "œ": "oe", "Œ": "OE" };
  let out = "";
  for (const ch of t.normalize("NFC")) {
    const r = remplace[ch] ?? ch;
    try {
      font.encodeText(r);
      out += r;
    } catch {
      out += r.normalize("NFD").replace(/[̀-ͯ]/g, "") || "?";
    }
  }
  return out;
}

/** Coupe un texte en lignes qui tiennent dans la largeur donnée. */
export function lignes(font: PDFFont, taille: number, t: string, largeur: number): string[] {
  const mots = texteSur(font, t).split(/\s+/).filter(Boolean);
  const res: string[] = [];
  let cour = "";
  for (const m of mots) {
    const essai = cour ? `${cour} ${m}` : m;
    if (font.widthOfTextAtSize(essai, taille) <= largeur || !cour) cour = essai;
    else {
      res.push(cour);
      cour = m;
    }
  }
  if (cour) res.push(cour);
  return res;
}

interface Polices {
  r: PDFFont;
  b: PDFFont;
  i: PDFFont;
}

class Mise {
  page!: PDFPage;
  y = 0;
  n = 0;
  constructor(
    private doc: PDFDocument,
    private f: Polices,
    private pied: (p: PDFPage, n: number) => void,
  ) {}

  nouvellePage() {
    this.page = this.doc.addPage([L, H]);
    this.n += 1;
    this.pied(this.page, this.n);
    this.lien(M, 26, 300, 14, lienFiche("/", "pied"));
    this.y = H - M;
  }

  place(h: number) {
    if (this.y - h < BAS) this.nouvellePage();
  }

  texte(t: string, o: { taille?: number; font?: PDFFont; couleur?: RGB; x?: number; largeur?: number; interligne?: number } = {}) {
    const taille = o.taille ?? 9.5;
    const font = o.font ?? this.f.r;
    const x = o.x ?? M;
    const il = o.interligne ?? taille * 1.38;
    for (const l of lignes(font, taille, t, o.largeur ?? LARGEUR - (x - M))) {
      this.place(il);
      this.page.drawText(l, { x, y: this.y - taille, size: taille, font, color: o.couleur ?? C.encre });
      this.y -= il;
    }
  }

  titre(t: string) {
    this.place(40);
    this.y -= 14;
    this.page.drawRectangle({ x: M, y: this.y - 1, width: 26, height: 1.2, color: C.laiton });
    this.y -= 8;
    this.texte(t, { taille: 13, font: this.f.b });
    this.y -= 4;
  }

  lien(x: number, y: number, w: number, h: number, url: string) {
    const ctx = this.doc.context;
    const annot = ctx.register(
      ctx.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [x, y, x + w, y + h],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
      }),
    );
    const annots = this.page.node.lookup(PDFName.of("Annots"));
    if (annots && "push" in annots) (annots as { push: (v: unknown) => void }).push(annot);
    else this.page.node.set(PDFName.of("Annots"), ctx.obj([annot]));
  }
}

function dessinerQr(page: PDFPage, texte: string, x: number, y: number, cote: number) {
  const qr = QRCode.create(texte, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const m = cote / n;
  page.drawRectangle({ x: x - 3, y: y - 3, width: cote + 6, height: cote + 6, color: C.blanc });
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (qr.modules.get(r, c)) page.drawRectangle({ x: x + c * m, y: y + cote - (r + 1) * m, width: m + 0.05, height: m + 0.05, color: C.encre });
    }
  }
}

/** Orthophoto IGN autour de la parcelle et contour en SVG (mètres) ; sans photo, le contour seul sur fond pierre. */
async function orthophoto(d: DonneesTerrain): Promise<{ jpg: Uint8Array; svg: string; ratio: number; largeurM: number } | null> {
  const cadre = cadrer([{ ...d.parcelle, distance: 0 }], 18);
  if (!cadre) return null;
  const base = { svg: cheminSvg(cadre, d.parcelle.contours), ratio: cadre.hauteur / cadre.largeur, largeurM: cadre.largeur };
  try {
    const r = await fetch(urlFondOrtho(cadre, 1100), { signal: AbortSignal.timeout(7000) });
    const ok = r.ok && (r.headers.get("content-type") ?? "").includes("jpeg");
    return { ...base, jpg: ok ? new Uint8Array(await r.arrayBuffer()) : new Uint8Array() };
  } catch {
    return { ...base, jpg: new Uint8Array() };
  }
}

export interface ContexteFiche {
  /** Date du jour, « 03/11/2026 ». */
  date: string;
  /** Prénom et nom du destinataire, pour l'en-tête. */
  pour: string;
}

export async function pdfFicheTerrain(d: DonneesTerrain, a: Analyse, x: ContexteFiche): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Fiche terrain : parcelle ${d.parcelle.section.replace(/^0/, "")} ${d.parcelle.numero}, ${d.parcelle.commune}`);
  doc.setAuthor(DOMAINE);
  doc.setCreator(DOMAINE);
  doc.setLanguage("fr-FR");
  const f: Polices = {
    r: await doc.embedFont(StandardFonts.Helvetica),
    b: await doc.embedFont(StandardFonts.HelveticaBold),
    i: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  const prix = formatEuro(plans[0].priceTTC);
  const pied = (p: PDFPage, n: number) => {
    p.drawRectangle({ x: M, y: 44, width: LARGEUR, height: 0.6, color: C.pierre2 });
    p.drawText(texteSur(f.b, DOMAINE), { x: M, y: 30, size: 8.5, font: f.b, color: C.encre });
    p.drawText(texteSur(f.r, `Votre permis de maison à prix fixe, dès ${prix} TTC · devis immédiat`), {
      x: M + f.b.widthOfTextAtSize(DOMAINE, 8.5) + 8,
      y: 30,
      size: 8.5,
      font: f.r,
      color: C.encre2,
    });
    p.drawText(`${n}`, { x: L - M - 6, y: 30, size: 8.5, font: f.r, color: C.encre2 });
  };
  const m = new Mise(doc, f, pied);
  m.nouvellePage();

  // En-tête : titre à gauche, QR code à droite.
  const qr = 66;
  dessinerQr(m.page, lienFiche("/", "qr-code"), L - M - qr, H - M - qr, qr);
  m.lien(L - M - qr, H - M - qr, qr, qr, lienFiche("/", "qr-code"));
  m.page.drawText(texteSur(f.b, DOMAINE), { x: L - M - qr - 4 - f.b.widthOfTextAtSize(DOMAINE, 7), y: H - M - qr - 12, size: 7, font: f.b, color: C.encre2 });
  m.texte("FICHE TERRAIN GRATUITE", { taille: 8, font: f.b, couleur: C.bronze, largeur: LARGEUR - qr - 20 });
  m.y -= 4;
  m.texte("Mon terrain est-il constructible ?", { taille: 21, font: f.b, largeur: LARGEUR - qr - 20, interligne: 26 });
  m.y -= 2;
  const ref = `Parcelle ${d.parcelle.section.replace(/^0/, "")} ${d.parcelle.numero} · ${d.parcelle.contenance.toLocaleString("fr-FR")} m² · ${d.parcelle.commune}`;
  if (d.adresse) m.texte(d.adresse, { taille: 10.5, largeur: LARGEUR - qr - 20 });
  m.texte(ref, { taille: 10.5, font: f.b, largeur: LARGEUR - qr - 20 });
  m.texte(`Établie le ${x.date} pour ${x.pour}`, { taille: 8.5, couleur: C.encre2, largeur: LARGEUR - qr - 20 });
  m.y = Math.min(m.y, H - M - qr - 22);

  // Vue aérienne avec le contour de la parcelle.
  const vue = await orthophoto(d);
  if (vue) {
    // Hauteur bornée à 150–250 pt, largeur déduite pour garder les proportions (le contour doit tomber juste).
    let h = Math.min(250, Math.max(150, LARGEUR * vue.ratio));
    let larg = h / vue.ratio;
    if (larg > LARGEUR) {
      larg = LARGEUR;
      h = larg * vue.ratio;
    }
    const xImg = M + (LARGEUR - larg) / 2;
    m.y -= 10;
    m.page.drawRectangle({ x: xImg, y: m.y - h, width: larg, height: h, color: C.pierre });
    if (vue.jpg.length) {
      const img = await doc.embedJpg(vue.jpg);
      m.page.drawImage(img, { x: xImg, y: m.y - h, width: larg, height: h });
    }
    m.page.drawSvgPath(vue.svg, { x: xImg, y: m.y, scale: larg / vue.largeurM, borderColor: rgb(0.85, 0.78, 0.62), borderWidth: 2.4 });
    m.page.drawText("© IGN · cadastre DGFiP", { x: xImg + larg - 82, y: m.y - h + 4, size: 6, font: f.r, color: C.blanc });
    m.y -= h + 14;
  }

  // Zone : l'encadré principal.
  const coul = COULEUR_NIVEAU[a.zone.niveau];
  const lz = lignes(f.r, 9.5, a.zone.detail, LARGEUR - 30);
  const hz = 34 + lz.length * 13;
  m.place(hz);
  m.page.drawRectangle({ x: M, y: m.y - hz, width: LARGEUR, height: hz, color: C.pierre });
  m.page.drawRectangle({ x: M, y: m.y - hz, width: 3.5, height: hz, color: coul });
  m.page.drawText(texteSur(f.b, `URBANISME · ${MOT_NIVEAU[a.zone.niveau].toUpperCase()}`), { x: M + 16, y: m.y - 16, size: 7.5, font: f.b, color: coul });
  m.page.drawText(texteSur(f.b, a.zone.titre).slice(0, 95), { x: M + 16, y: m.y - 30, size: 11.5, font: f.b, color: C.encre });
  lz.forEach((l, i) => m.page.drawText(l, { x: M + 16, y: m.y - 45 - i * 13, size: 9.5, font: f.r, color: C.encre }));
  m.y -= hz + 12;

  // Les quatre voyants de risques.
  for (const v of a.voyants.slice(1)) {
    const lv = lignes(f.r, 9.5, v.resume, LARGEUR - 132);
    const hv = Math.max(30, 8 + lv.length * 13);
    m.place(hv);
    const c = COULEUR_NIVEAU[v.niveau];
    m.page.drawCircle({ x: M + 6, y: m.y - 9, size: 4.2, color: c });
    m.page.drawText(texteSur(f.b, v.titre), { x: M + 18, y: m.y - 12, size: 9.5, font: f.b, color: C.encre });
    m.page.drawText(texteSur(f.b, MOT_NIVEAU[v.niveau]), { x: M + 18, y: m.y - 24, size: 7.5, font: f.b, color: c });
    lv.forEach((l, i) => m.page.drawText(l, { x: M + 132, y: m.y - 12 - i * 13, size: 9.5, font: f.r, color: C.encre }));
    m.y -= hv;
    m.page.drawRectangle({ x: M, y: m.y + 2, width: LARGEUR, height: 0.5, color: C.pierre2 });
    m.y -= 6;
  }

  // Ce que ça change, le détail, les liens : à la suite, sur deux pages le plus souvent.
  m.titre("Ce que ça change pour votre projet");
  for (const p of a.points) {
    const c = COULEUR_NIVEAU[p.niveau];
    // Un point ne se coupe pas d'une page à l'autre.
    m.place(14 + lignes(f.r, 9.5, p.texte, LARGEUR - 12).length * 13.1 + 5);
    m.page.drawRectangle({ x: M, y: m.y - 11, width: 3, height: 10, color: c });
    m.texte(p.titre, { taille: 10, font: f.b, x: M + 12 });
    m.texte(p.texte, { taille: 9.5, x: M + 12 });
    m.y -= 5;
  }

  const tableau = (titre: string, l: { libelle: string; valeur: string }[]) => {
    m.titre(titre);
    for (const r of l) {
      const lv = lignes(f.r, 9, r.valeur, LARGEUR - 130);
      const ll = lignes(f.b, 8, r.libelle, 120);
      const n = Math.max(lv.length, ll.length);
      m.place(n * 12 + 3);
      ll.forEach((t, i) => m.page.drawText(t, { x: M, y: m.y - 9 - i * 12, size: 8, font: f.b, color: C.encre2 }));
      lv.forEach((t, i) => m.page.drawText(t, { x: M + 130, y: m.y - 9 - i * 12, size: 9, font: f.r, color: C.encre }));
      m.y -= n * 12 + 3;
    }
  };
  tableau("Urbanisme", a.urbanisme);
  tableau("Risques", a.risques);

  m.titre("Pour aller plus loin");
  const liens: [string, string | null][] = [
    ["Règlement de la zone (Géoportail de l'urbanisme)", a.liens.reglement],
    ["Votre parcelle sur la carte du Géoportail de l'urbanisme", a.liens.geoportail],
    ["Les risques près de chez vous (Géorisques)", a.liens.georisques],
  ];
  for (const [t, u] of liens) {
    if (!u) continue;
    m.place(14);
    m.page.drawText(texteSur(f.r, `> ${t}`), { x: M, y: m.y - 9.5, size: 9.5, font: f.r, color: C.bronze });
    m.lien(M, m.y - 12, f.r.widthOfTextAtSize(texteSur(f.r, `> ${t}`), 9.5), 13, u);
    m.y -= 14;
  }

  // Encadré du permis.
  const hc = 70;
  m.place(hc + 18);
  m.y -= 14;
  m.page.drawRectangle({ x: M, y: m.y - hc, width: LARGEUR, height: hc, color: C.encre });
  m.page.drawText(texteSur(f.b, `Votre permis de maison, à prix fixe, dès ${prix} TTC`), { x: M + 18, y: m.y - 24, size: 12.5, font: f.b, color: C.blanc });
  m.page.drawText(texteSur(f.r, "Dossier complet PCMI 1 à 8, prêt à déposer. Devis immédiat, paiement en 1, 4 ou 10 fois sans frais."), {
    x: M + 18,
    y: m.y - 40,
    size: 9,
    font: f.r,
    color: rgb(0.85, 0.82, 0.76),
  });
  const cta = `${DOMAINE}/commander`;
  m.page.drawText(texteSur(f.b, cta), { x: M + 18, y: m.y - 57, size: 10.5, font: f.b, color: rgb(0.85, 0.78, 0.62) });
  m.lien(M, m.y - hc, LARGEUR, hc, lienFiche("/commander", "encadre"));
  m.y -= hc + 12;

  for (const t of a.avertissements) m.texte(t, { taille: 7.5, font: f.i, couleur: C.encre2, interligne: 10 });

  return doc.save();
}
