import { describe, expect, it } from "vitest";
import {
  ajuster,
  capacite,
  decouper,
  echapperXml,
  formatDateLongue,
  LONGUEUR_MAX,
  MENTION_RECOURS,
  miseEnPage,
  nomFichier,
  PANNEAU_VIDE,
  svgPanneau,
  validerPanneau,
  valeursChiffrees,
  type PanneauSaisie,
} from "./panneau";

const complet: PanneauSaisie = {
  ...PANNEAU_VIDE,
  numero: "PC 076 351 26 00012",
  dateDelivrance: "2026-10-12",
  beneficiaire: "M. et Mme Martin",
  superficieTerrain: "650",
  surfacePlancher: "118,5",
  hauteur: "6,40",
  mairie: "Mairie du Havre, 1517 place de l'Hôtel de Ville, 76600 Le Havre",
};
const s = (over: Partial<PanneauSaisie>): PanneauSaisie => ({ ...complet, ...over });

/** Saisie la plus longue autorisée : tout doit encore tenir sur le panneau. */
const pire: PanneauSaisie = {
  ...complet,
  numero: "X".repeat(LONGUEUR_MAX.numero),
  beneficiaire: "Société civile immobilière des Hauts de la Côte Fleurie".padEnd(LONGUEUR_MAX.beneficiaire, "x"),
  nature: "Construction d'une maison individuelle de plain-pied avec garage accolé, piscine et clôture sur rue".padEnd(LONGUEUR_MAX.nature, "x"),
  superficieTerrain: "123456789",
  surfacePlancher: "149,99",
  hauteur: "12,50",
  surfaceDemolie: "85,5",
  mairie: "Mairie de Sainte-Adresse, service urbanisme, 2 place Clemenceau, 76310 Sainte-Adresse".padEnd(LONGUEUR_MAX.mairie, "x"),
  secteurProtege: true,
};

describe("formatDateLongue", () => {
  it("écrit la date en toutes lettres, sans dépendre du fuseau", () => {
    expect(formatDateLongue("2026-10-12")).toBe("12 octobre 2026");
    expect(formatDateLongue("2026-03-01")).toBe("1er mars 2026");
  });

  it("refuse une date impossible ou mal formée", () => {
    expect(formatDateLongue("2026-02-30")).toBeNull();
    expect(formatDateLongue("12/10/2026")).toBeNull();
  });
});

describe("validerPanneau", () => {
  it("accepte un panneau complet", () => {
    expect(validerPanneau(complet)).toEqual({});
  });

  it("exige les mentions obligatoires", () => {
    const e = validerPanneau(PANNEAU_VIDE);
    expect(Object.keys(e).sort()).toEqual(["beneficiaire", "dateDelivrance", "mairie", "numero", "superficieTerrain"]);
  });

  it("refuse une surface qui n'est pas un nombre", () => {
    expect(validerPanneau(s({ surfacePlancher: "cent" })).surfacePlancher).toBeDefined();
    expect(validerPanneau(s({ superficieTerrain: "0" })).superficieTerrain).toBeDefined();
  });

  it("laisse les champs chiffrés facultatifs vides", () => {
    expect(validerPanneau(s({ surfacePlancher: "", hauteur: "", surfaceDemolie: "" }))).toEqual({});
  });

  it("refuse une hauteur manifestement en centimètres", () => {
    expect(validerPanneau(s({ hauteur: "640" })).hauteur).toBeDefined();
  });

  it("limite la longueur des textes", () => {
    expect(validerPanneau(s({ beneficiaire: "a".repeat(LONGUEUR_MAX.beneficiaire + 1) })).beneficiaire).toMatch(/caractères/);
  });
});

describe("valeursChiffrees", () => {
  it("formate les nombres à la française et omet les champs vides", () => {
    expect(valeursChiffrees(complet)).toEqual([
      { libelle: "Superficie du terrain", valeur: "650 m²" },
      { libelle: "Surface de plancher autorisée", valeur: "118,5 m²" },
      { libelle: "Hauteur / sol naturel", valeur: "6,4 m" },
    ]);
  });

  it("utilise des espaces ordinaires dans les milliers", () => {
    expect(valeursChiffrees(s({ superficieTerrain: "1250" }))[0].valeur).toBe("1 250 m²");
  });
});

describe("decouper et ajuster", () => {
  it("coupe aux espaces sans dépasser la largeur", () => {
    const lignes = decouper(MENTION_RECOURS, 60);
    expect(lignes.every((l) => l.length <= 60)).toBe(true);
    expect(lignes.join(" ")).toBe(MENTION_RECOURS);
  });

  it("coupe net un mot plus long que la ligne", () => {
    expect(decouper("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("garde la plus grande taille qui tient", () => {
    expect(ajuster("Court", 1080, 46, 30, 1).taille).toBe(46);
    const long = ajuster("a ".repeat(60).trim(), 1080, 46, 30, 1);
    expect(long.taille).toBeLessThan(46);
    expect(long.lignes).toHaveLength(1);
    expect(long.lignes[0].length).toBeLessThanOrEqual(capacite(1080, long.taille));
  });
});

describe("svgPanneau", () => {
  it("produit un SVG au format réel 120 × 80 cm", () => {
    const svg = svgPanneau(complet);
    expect(svg).toMatch(/^<svg [^>]*width="1200mm" height="800mm" viewBox="0 0 1200 800"/);
    expect(svg).toContain("PERMIS DE CONSTRUIRE");
    expect(svg).toContain("délivré le 12 octobre 2026");
    expect(svg).toContain("118,5 m²");
  });

  it("porte la mention des droits de recours", () => {
    const svg = svgPanneau(complet);
    expect(svg).toContain("Droit de recours");
    expect(svg).toMatch(/R\.\s600-2/);
    expect(svg).toMatch(/R\.\s600-1/);
  });

  it("titre « déclaration préalable » pour une DP", () => {
    expect(svgPanneau(s({ type: "DP" }))).toContain("DÉCLARATION PRÉALABLE");
  });

  it("échappe le texte saisi", () => {
    const svg = svgPanneau(s({ beneficiaire: '<script>alert("x")</script> & fils' }));
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp; fils");
    expect(echapperXml(`'"`)).toBe("&apos;&quot;");
  });

  it("ajoute la mention ABF en secteur protégé et le crédit si demandé", () => {
    expect(svgPanneau(s({ secteurProtege: true }))).toContain("Architecte des Bâtiments de France");
    expect(svgPanneau(s({ credit: false }))).not.toContain("permis-maison-individuelle.fr");
  });

  it("fait tenir la saisie la plus longue sans chevaucher les recours", () => {
    expect(validerPanneau(pire)).toEqual({});
    const m = miseEnPage(pire);
    // Au moins 6 mm de blanc entre la dernière mention et le cadre des recours.
    expect(m.basMentions).toBeLessThanOrEqual(m.hautRecours - 6);
  });
});

describe("nomFichier", () => {
  it("donne un nom de fichier propre", () => {
    expect(nomFichier(complet)).toBe("panneau-pc-pc-076-351-26-00012.svg");
    expect(nomFichier(s({ numero: "" }))).toBe("panneau-pc.svg");
  });
});
