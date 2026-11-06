import { describe, expect, test } from "vitest";
import {
  angleTerrain,
  dansPolygone,
  decaler,
  distanceLimites,
  ecart,
  ficheWorkflow,
  formesBassin,
  orientationCote,
  prixHt,
  regimeIndicatif,
  validerDemandeDp,
  type Bassin,
} from "@/lib/dpPiscine";

const centre: [number, number] = [0.1614, 49.5216];
const bassin: Bassin = {
  longueur: 8,
  largeur: 4,
  profondeur: 1.5,
  margelle: 0.3,
  plage: { petit_cote_1: 1, petit_cote_2: 2.5, grand_cote_1: 1, grand_cote_2: 1 },
  localTechnique: true,
  type: "enterree",
  securite: "alarme",
  visibleRue: false,
  centre,
  angle: 30,
};

const demande = (p: Partial<Record<string, unknown>> = {}) => ({
  idu: "76351000PM0096",
  voie: "43 rue Jean Bouvier",
  ville: "76620 Le Havre",
  commune: "Le Havre",
  prenom: "Jean",
  nom: "Durand",
  email: "jean@example.fr",
  telephone: "06 12 34 56 78",
  consentement: true,
  bassin,
  ...p,
});

describe("régime indicatif", () => {
  test("10 m² ou moins : aucune formalité, au-delà de 100 m² : permis", () => {
    expect(regimeIndicatif({ longueur: 3, largeur: 3 })).toBe("aucune");
    expect(regimeIndicatif({ longueur: 8, largeur: 4 })).toBe("dp");
    expect(regimeIndicatif({ longueur: 12.5, largeur: 8 })).toBe("dp");
    expect(regimeIndicatif({ longueur: 12, largeur: 9 })).toBe("pc");
  });
});

describe("géométrie du bassin sur la carte", () => {
  test("décaler puis mesurer redonne les mètres", () => {
    const [dx, dy] = ecart(centre, decaler(centre, 12, -7));
    expect(dx).toBeCloseTo(12, 6);
    expect(dy).toBeCloseTo(-7, 6);
  });

  test("bassin, margelles et plage aux bonnes dimensions, plage plus large côté petit_cote_2", () => {
    const g = formesBassin({ ...bassin, angle: 0 });
    const [l, h] = ecart(g.bassin[0], g.bassin[2]);
    expect(l).toBeCloseTo(8, 4);
    expect(h).toBeCloseTo(4, 4);
    const [x0] = ecart(centre, g.plage[0]);
    const [x1] = ecart(centre, g.plage[1]);
    expect(x0).toBeCloseTo(-(4 + 0.3 + 1), 4);
    expect(x1).toBeCloseTo(4 + 0.3 + 2.5, 4);
    expect(g.local).not.toBeNull();
  });

  test("orientation des côtés (bassin aligné est-ouest)", () => {
    expect(orientationCote(0, "petit_cote_2")).toBe("est");
    expect(orientationCote(0, "grand_cote_2")).toBe("nord");
    expect(orientationCote(0, "petit_cote_1")).toBe("ouest");
    expect(orientationCote(0, "grand_cote_1")).toBe("sud");
    expect(orientationCote(45, "petit_cote_2")).toBe("nord-est");
  });

  test("angle du terrain : son plus long côté", () => {
    const c = [centre, decaler(centre, 30, 0), decaler(centre, 30, 10), decaler(centre, 0, 10), centre];
    expect(angleTerrain(c)).toBeCloseTo(0, 3);
  });

  test("point dans le terrain", () => {
    const c = [centre, decaler(centre, 30, 0), decaler(centre, 30, 10), decaler(centre, 0, 10)];
    expect(dansPolygone(decaler(centre, 5, 5), c)).toBe(true);
    expect(dansPolygone(decaler(centre, 35, 5), c)).toBe(false);
  });
});

describe("distance du bassin aux limites", () => {
  test("bassin de 8 x 4 à 2 m de la limite ouest d'un terrain de 30 x 20", () => {
    const terrain = [centre, decaler(centre, 30, 0), decaler(centre, 30, 20), decaler(centre, 0, 20), centre];
    const g = formesBassin({ ...bassin, angle: 0, centre: decaler(centre, 6, 10) });
    const r = distanceLimites(g.bassin, [terrain]);
    expect(r?.d).toBeCloseTo(2, 2);
    const [dx, dy] = ecart(r!.de, r!.a);
    expect(Math.hypot(dx, dy)).toBeCloseTo(2, 2);
  });
});

describe("terrain de deux parcelles", () => {
  test("la limite commune aux deux parcelles ne compte pas", () => {
    const a = [centre, decaler(centre, 15, 0), decaler(centre, 15, 20), decaler(centre, 0, 20), centre];
    const b = [decaler(centre, 15, 0), decaler(centre, 30, 0), decaler(centre, 30, 20), decaler(centre, 15, 20), decaler(centre, 15, 0)];
    // bassin de x = 5 à 13 dans la parcelle a : 2 m de la limite commune (x = 15), 5 m de la limite ouest
    const g = formesBassin({ ...bassin, angle: 0, centre: decaler(centre, 9, 10) });
    expect(distanceLimites(g.bassin, [a])?.d).toBeCloseTo(2, 2);
    expect(distanceLimites(g.bassin, [a, b])?.d).toBeCloseTo(5, 2);
  });

  test("demande à deux parcelles acceptée, la fiche les transmet toutes", () => {
    const v = validerDemandeDp(demande({ idus: ["76351000PM0096", "76351000PM0097"] }));
    if (!("demande" in v)) throw new Error("demande refusée");
    expect(v.demande.idus).toEqual(["76351000PM0096", "76351000PM0097"]);
    expect(ficheWorkflow(v.demande).parcelle).toEqual(["76351000PM0096", "76351000PM0097"]);
  });
});

describe("validation de la demande", () => {
  test("demande complète acceptée, nom en majuscules", () => {
    const v = validerDemandeDp(demande());
    expect("demande" in v).toBe(true);
    if ("demande" in v) {
      expect(v.demande.nom).toBe("DURAND");
      expect(v.demande.telephone).toBe("0612345678");
      expect(v.demande.bassin.centre).toEqual(centre);
    }
  });

  test("refus : parcelle, e-mail, consentement, bassin hors DP", () => {
    const v = validerDemandeDp(demande({ idu: "X", email: "pas-un-mail", consentement: false, bassin: { ...bassin, longueur: 3, largeur: 3 } }));
    expect("erreurs" in v && Object.keys(v.erreurs).sort()).toEqual(["bassin", "consentement", "email", "idu"]);
  });

  test("refus : dimensions hors bornes ou texte suspect", () => {
    expect("erreurs" in validerDemandeDp(demande({ bassin: { ...bassin, profondeur: 5 } }))).toBe(true);
    expect("erreurs" in validerDemandeDp(demande({ prenom: "<script>" }))).toBe(true);
  });
});

describe("fiche transmise à l'outil", () => {
  test("format de outils/dp_piscine_site.py, axe à 5 m dans l'angle", () => {
    const v = validerDemandeDp(demande());
    if (!("demande" in v)) throw new Error("demande refusée");
    const f = ficheWorkflow(v.demande);
    expect(f.client).toBe("Jean DURAND");
    expect(f.parcelle).toBe("76351000PM0096");
    expect(f.piscine.local_technique).toEqual({ longueur: 2, largeur: 1.5, hauteur: 2 });
    const [dx, dy] = ecart(f.piscine.centre_wgs84, f.piscine.axe_wgs84);
    expect(Math.hypot(dx, dy)).toBeCloseTo(5, 4);
    expect((Math.atan2(dy, dx) * 180) / Math.PI).toBeCloseTo(30, 3);
  });

  test("prix HT d'un prix TTC de 100 € à 20 %", () => {
    expect(prixHt(100, 0.2)).toBe("83.33");
  });
});
