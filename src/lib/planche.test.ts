import { describe, expect, it } from "vitest";
import {
  cadrer,
  centre,
  cheminSvg,
  distanceAuContour,
  estIdu,
  nomCartouche,
  projeter,
  referenceCourte,
  urlFondOrtho,
  validerDemande,
  type ParcelleCandidate,
} from "./planche";
import { chiffrer, dechiffrer, empreinteParcelle, signerRappel, verifierRappel } from "./plancheSecret";
import { emailClientPlanche, emailInterneDemande, nomFichierPlanche } from "./emailsPlanche";

const corps = {
  planche: "masse",
  idu: "76351000OJ0646",
  voie: "28 Rue Léon Hallaure",
  ville: "76620 Le Havre",
  commune: "Le Havre",
  prenom: "jean-marie",
  nom: "Durand",
  email: "Jean.Durand@exemple.fr",
  consentement: true,
};

/** Carré d'environ 20 m de côté près du Havre. */
const carre: [number, number][] = [
  [0.0958, 49.5194],
  [0.09608, 49.5194],
  [0.09608, 49.51958],
  [0.0958, 49.51958],
  [0.0958, 49.5194],
];
const parcelle: ParcelleCandidate = {
  idu: "76351000OJ0646",
  section: "OJ",
  numero: "0646",
  commune: "Le Havre",
  codeInsee: "76351",
  contenance: 400,
  contours: [carre],
  distance: 0,
};

describe("références cadastrales", () => {
  it("reconnaît un IDU de 14 caractères", () => {
    expect(estIdu("76351000OJ0646")).toBe(true);
    expect(estIdu("2A004000AB0012")).toBe(true);
    expect(estIdu("76351 OJ 646")).toBe(false);
  });

  it("donne la référence courte de la section et du numéro", () => {
    expect(referenceCourte("76351000OJ0646")).toBe("OJ 0646");
    expect(referenceCourte("763510000B1027")).toBe("B 1027");
  });
});

describe("validerDemande", () => {
  it("accepte une demande complète et la nettoie", () => {
    const r = validerDemande(corps);
    expect("demande" in r && r.demande.email).toBe("jean.durand@exemple.fr");
  });

  it("signale chaque champ manquant", () => {
    const r = validerDemande({});
    expect("erreurs" in r && Object.keys(r.erreurs).sort()).toEqual(
      ["consentement", "email", "idu", "nom", "planche", "prenom", "ville", "voie"].sort(),
    );
  });

  it("exige le consentement explicite", () => {
    const r = validerDemande({ ...corps, consentement: "true" });
    expect("erreurs" in r && r.erreurs.consentement).toBeDefined();
  });

  it("refuse une planche inconnue et un e-mail invalide", () => {
    const r = validerDemande({ ...corps, planche: "facades", email: "jean@" });
    expect("erreurs" in r && Object.keys(r.erreurs).sort()).toEqual(["email", "planche"]);
  });

  it("refuse les caractères qui n'ont rien à faire dans un cartouche", () => {
    const r = validerDemande({ ...corps, nom: "Durand<script>" });
    expect("erreurs" in r && r.erreurs.nom).toBeDefined();
  });
});

describe("nomCartouche", () => {
  it("écrit le prénom avec ses majuscules et le nom en capitales", () => {
    expect(nomCartouche({ prenom: "jean-marie", nom: "Durand" })).toBe("Jean-Marie DURAND");
    expect(nomCartouche({ prenom: "ÉLODIE", nom: "d'Arc" })).toBe("Élodie D'ARC");
  });
});

describe("géométrie d'affichage", () => {
  it("cadre la parcelle avec sa marge, en mètres", () => {
    const c = cadrer([parcelle], 10)!;
    // ≈ 20 m de côté + 2 × 10 m de marge
    expect(c.largeur).toBeGreaterThan(38);
    expect(c.largeur).toBeLessThan(42);
    expect(c.hauteur).toBeGreaterThan(38);
    expect(c.hauteur).toBeLessThan(42);
  });

  it("projette le coin nord-ouest du cadre à l'origine", () => {
    const c = cadrer([parcelle], 10)!;
    expect(projeter(c, [c.ouest, c.nord])).toEqual([0, 0]);
    const [x, y] = projeter(c, [c.est, c.sud]);
    expect(x).toBeCloseTo(c.largeur, 1);
    expect(y).toBeCloseTo(c.hauteur, 1);
  });

  it("trace un chemin SVG fermé et centre le numéro dans la parcelle", () => {
    const c = cadrer([parcelle], 10)!;
    expect(cheminSvg(c, parcelle.contours)).toMatch(/^M[\d. ]+( L[\d. ]+)+ Z$/);
    const [x, y] = centre(c, parcelle.contours);
    expect(x).toBeGreaterThan(10);
    expect(y).toBeGreaterThan(10);
  });

  it("renvoie null sans parcelle", () => {
    expect(cadrer([])).toBeNull();
  });

  it("demande l'orthophoto avec les axes du WMS 1.3.0 en EPSG:4326", () => {
    const c = cadrer([parcelle], 10)!;
    const url = new URL(urlFondOrtho(c, 800));
    expect(url.searchParams.get("CRS")).toBe("EPSG:4326");
    expect(url.searchParams.get("BBOX")!.split(",").map(Number)[0]).toBeCloseTo(c.sud, 6);
    expect(Number(url.searchParams.get("HEIGHT"))).toBe(Math.round((800 * c.hauteur) / c.largeur));
  });

  it("mesure la distance d'un point à la parcelle", () => {
    expect(distanceAuContour([0.0959, 49.5195], [carre])).toBe(0);
    // ≈ 0,0001° de latitude au sud du bord sud : ≈ 11 m
    const d = distanceAuContour([0.0959, 49.5193], [carre]);
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(12.5);
  });
});

describe("secrets de la planche", () => {
  const secret = "un-secret-de-test";

  it("donne la même empreinte à la même parcelle, et une autre avec un autre secret", () => {
    expect(empreinteParcelle("76351000OJ0646", secret)).toBe(empreinteParcelle("76351000oj0646", secret));
    expect(empreinteParcelle("76351000OJ0646", secret)).not.toBe(empreinteParcelle("76351000OJ0646", "autre"));
    expect(empreinteParcelle("76351000OJ0646", secret)).not.toContain("OJ");
  });

  it("vérifie la signature de l'adresse de rappel et son expiration", () => {
    const expire = Date.now() + 60_000;
    const signature = signerRappel("id1", "abc", expire, secret);
    expect(verifierRappel({ id: "id1", empreinte: "abc", expire, signature }, secret)).toBe(true);
    expect(verifierRappel({ id: "id2", empreinte: "abc", expire, signature }, secret)).toBe(false);
    expect(verifierRappel({ id: "id1", empreinte: "abc", expire, signature }, "autre")).toBe(false);
    expect(verifierRappel({ id: "id1", empreinte: "abc", expire, signature }, secret, expire + 1)).toBe(false);
    expect(verifierRappel({ id: "id1", empreinte: "abc", expire, signature: "zz" }, secret)).toBe(false);
  });

  it("chiffre les coordonnées et refuse un texte altéré", () => {
    const c = chiffrer('{"email":"a@b.fr"}', secret);
    expect(c).not.toContain("a@b.fr");
    expect(dechiffrer(c, secret)).toBe('{"email":"a@b.fr"}');
    expect(dechiffrer(c, "autre")).toBeNull();
    expect(dechiffrer(c.slice(0, -2) + "AA", secret)).toBeNull();
  });
});

describe("e-mails de la planche", () => {
  const contact = { prenom: "Jean", nom: "Durand", email: "jean@exemple.fr" };
  const x = { planche: "coupes" as const, reference: "OJ 0646", commune: "Le Havre", adresse: "28 Rue Léon Hallaure, 76620 Le Havre" };

  it("nomme le fichier joint sans accent ni espace", () => {
    expect(nomFichierPlanche(x)).toBe("ID-Maitrise_Coupes-du-terrain_Le-Havre_OJ-0646.pdf");
  });

  it("présente la planche au visiteur sans promettre plus qu'un document indicatif", () => {
    const m = emailClientPlanche(contact, x);
    expect(m.subject).toBe("Votre planche gratuite : coupes du terrain — Le Havre");
    expect(m.html).toContain("ne remplace pas un plan de géomètre");
    expect(m.html).toContain("/tarifs");
  });

  it("signale à Dursun une planche à faire à la main", () => {
    expect(emailInterneDemande(contact, x, true).subject).toContain("À FAIRE À LA MAIN");
    expect(emailInterneDemande(contact, x, false).html).toContain("en cours de dessin");
  });

  it("échappe les données du visiteur", () => {
    const m = emailInterneDemande({ ...contact, nom: "<b>X</b>" }, x, false);
    expect(m.html).not.toContain("<b>X</b>");
  });
});
