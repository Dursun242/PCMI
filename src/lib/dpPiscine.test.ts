import { describe, expect, test } from "vitest";
import {
  angleTerrain,
  MARGELLE_DEFAUT_M,
  PLAGE_DEFAUT_M,
  arasePrevue,
  cotesLimites,
  distanceBati,
  matrice3d,
  placementInitial,
  dansPolygone,
  decaler,
  distanceLimites,
  ecart,
  dateNaissanceValide,
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
  naissance: "1980-05-12",
  communeNaissance: "Le Havre",
  deptNaissance: "76",
  paysNaissance: "France",
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

describe("photos (piscine visible de la rue)", () => {
  const u = "https://abc123.public.blob.vercel-storage.com/dp-piscine-photos/1-proche.jpeg";
  const photos = { proche: u, lointaine: u.replace("proche", "lointaine"), coins: [[10, 900], [1100, 880], [950, 560], [200, 570]], repere: [1600, 1200] };

  test("visible de la rue sans photos : refusé ; avec photos et 4 coins : accepté et transmis", () => {
    const sans = validerDemandeDp(demande({ bassin: { ...bassin, visibleRue: true } }));
    expect("erreurs" in sans && sans.erreurs.photos).toBeTruthy();
    const avec = validerDemandeDp(demande({ bassin: { ...bassin, visibleRue: true }, photos }));
    if (!("demande" in avec)) throw new Error("demande refusée");
    const f = ficheWorkflow(avec.demande) as ReturnType<typeof ficheWorkflow> & { photos?: { insertion?: { coins_px: number[][] } } };
    expect(f.photos?.insertion?.coins_px).toEqual(photos.coins);
  });

  test("photo hors du stockage du site ou coin hors de la photo : refusé", () => {
    expect("erreurs" in validerDemandeDp(demande({ photos: { ...photos, proche: "https://exemple.com/x.jpg" } }))).toBe(true);
    expect("erreurs" in validerDemandeDp(demande({ photos: { ...photos, coins: [[10, 900], [1100, 880], [950, 560], [2000, 570]] } }))).toBe(true);
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

  test("téléphone international ramené au format français", () => {
    const v = validerDemandeDp(demande({ telephone: "+33 6 79 11 60 85" }));
    expect("demande" in v && v.demande.telephone).toBe("0679116085");
  });

  test("refus : parcelle, e-mail, consentement, bassin hors DP", () => {
    const v = validerDemandeDp(demande({ idu: "X", email: "pas-un-mail", consentement: false, bassin: { ...bassin, longueur: 3, largeur: 3 } }));
    expect("erreurs" in v && Object.keys(v.erreurs).sort()).toEqual(["bassin", "consentement", "email", "idu"]);
  });

  test("naissance obligatoire (Cerfa 16702, cadre 1) : date réelle, commune, département", () => {
    const v = validerDemandeDp(demande({ naissance: "", communeNaissance: "", deptNaissance: "" }));
    expect("erreurs" in v && Object.keys(v.erreurs).sort()).toEqual(["communeNaissance", "deptNaissance", "naissance"]);
    expect("erreurs" in validerDemandeDp(demande({ naissance: "1980-02-30" }))).toBe(true);
    expect("erreurs" in validerDemandeDp(demande({ deptNaissance: "99" }))).toBe(true);
    expect(dateNaissanceValide("2015-01-01", new Date("2026-11-06"))).toBe(false);
    expect(dateNaissanceValide("1955-12-31", new Date("2026-11-06"))).toBe(true);
  });

  test("naissance à l'étranger : département 99 par défaut, Corse acceptée", () => {
    const v = validerDemandeDp(demande({ deptNaissance: "", paysNaissance: "Portugal", communeNaissance: "Porto" }));
    expect("demande" in v && v.demande.naissance).toEqual({ date: "1980-05-12", commune: "Porto", departement: "99", pays: "Portugal" });
    expect("demande" in validerDemandeDp(demande({ deptNaissance: "2a" }))).toBe(true);
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
    expect(f.piscine.local_technique).toEqual({ longueur: 2, largeur: 1.5, hauteur: 1.8, materiau: "bois" });
    expect(f.demandeur.naissance).toEqual({ date: "1980-05-12", commune: "Le Havre", departement: "76", pays: "France" });
    const [dx, dy] = ecart(f.piscine.centre_wgs84, f.piscine.axe_wgs84);
    expect(Math.hypot(dx, dy)).toBeCloseTo(5, 4);
    expect((Math.atan2(dy, dx) * 180) / Math.PI).toBeCloseTo(30, 3);
  });

  test("prix HT d'un prix TTC de 100 € à 20 %", () => {
    expect(prixHt(100, 0.2)).toBe("83.33");
  });
});

describe("local technique et valeurs par défaut", () => {
  test("matériau du local transmis à l'outil (DPC4), bois si inconnu", () => {
    const v = validerDemandeDp(demande({ bassin: { ...bassin, materiauLocal: "enduit" } }));
    if (!("demande" in v)) throw new Error("demande refusée");
    expect(ficheWorkflow(v.demande).piscine.local_technique).toMatchObject({ materiau: "enduit" });
    const w = validerDemandeDp(demande({ bassin: { ...bassin, materiauLocal: "béton" } }));
    expect("demande" in w && w.demande.bassin.materiauLocal).toBe("bois");
  });
  test("margelles de 20 cm et pas de plage par défaut", () => {
    expect(MARGELLE_DEFAUT_M).toBe(0.2);
    expect(PLAGE_DEFAUT_M).toBe(0);
  });
});

describe("étapes en direct", () => {
  const terrain = [centre, decaler(centre, 30, 0), decaler(centre, 30, 20), decaler(centre, 0, 20), centre];
  const maison = [decaler(centre, 2, 2), decaler(centre, 12, 2), decaler(centre, 12, 10), decaler(centre, 2, 10), decaler(centre, 2, 2)];

  test("deux cotes aux limites, dans deux directions différentes", () => {
    const g = formesBassin({ ...bassin, angle: 0, centre: decaler(centre, 8, 15) });
    const c = cotesLimites(g.bassin, [terrain]);
    expect(c.map((x) => x.d)).toEqual([3, 4]); // nord (20 - 17) puis ouest (8 - 4)
  });

  test("premier emplacement : dans le terrain, hors de la maison, à 1,50 m au moins", () => {
    const pl = placementInitial({ ...bassin, localTechnique: false, plage: { petit_cote_1: 1, petit_cote_2: 1, grand_cote_1: 1, grand_cote_2: 1 } }, [terrain], [maison]);
    const g = formesBassin({ ...bassin, ...pl, localTechnique: false, plage: { petit_cote_1: 1, petit_cote_2: 1, grand_cote_1: 1, grand_cote_2: 1 } });
    expect(distanceBati(g.bassin, [maison])!.d).toBeGreaterThanOrEqual(1.5);
  });

  test("photomontage : la matrice envoie les coins de la texture sur les 4 points de la photo", () => {
    const src: [number, number][] = [[0, 400], [1000, 400], [1000, 0], [0, 0]];
    const dst: [number, number][] = [[43, 300], [380, 290], [320, 180], [90, 185]];
    const m = matrice3d(src, dst)!.replace(/^matrix3d\(|\)$/g, "").split(",").map(Number);
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i];
      const w = m[3] * x + m[7] * y + m[15];
      expect((m[0] * x + m[4] * y + m[12]) / w).toBeCloseTo(dst[i][0], 4);
      expect((m[1] * x + m[5] * y + m[13]) / w).toBeCloseTo(dst[i][1], 4);
    }
  });

  test("margelles : TN moyen aux 5 cm, + 5 cm", () => {
    expect(arasePrevue([85.21, 85.28, 85.3])).toBe(85.3); // moyenne 85,263 -> 85,25 + 0,05
  });
});
