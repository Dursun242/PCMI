import { describe, expect, it } from "vitest";
import { analyserTerrain, apercu, dateFr, libelleMention, libelleServitude, validerDemandeFiche, type DonneesTerrain } from "./ficheTerrain";
import { emailClientFiche, emailInterneFiche, nomFichierFiche } from "./emailsFiche";

/** Terrain urbain sans contrainte, au Havre. */
const base: DonneesTerrain = {
  parcelle: {
    idu: "76351000OJ0646",
    section: "OJ",
    numero: "0646",
    commune: "Le Havre",
    codeInsee: "76351",
    contenance: 1197,
    contours: [[[0.0958, 49.5194], [0.0961, 49.5194], [0.0961, 49.5196], [0.0958, 49.5194]]],
    centre: [0.0959, 49.5195],
  },
  adresse: "28 Rue Léon Hallaure, 76620 Le Havre",
  urbanisme: {
    etat: "ok",
    rnu: false,
    document: { type: "PLUi", nom: "PLUI LE HAVRE SEINE METROPOLE", date: "20260212", miseEnLigne: "2026-04-01T16:08:57.610Z" },
    zones: [{ libelle: "UB", libelong: "Zone urbaine de forte densité", typezone: "U", reglementUrl: "https://exemple/reglement.pdf#page=116" }],
    secteursCC: [],
    prescriptions: [],
    informations: [],
    servitudes: [],
  },
  risques: { etat: "ok", argiles: 1, cavites: [], mouvements: [], sismicite: 1, radon: 1, commune: ["Inondation"] },
};

type Patch = { urbanisme?: Partial<DonneesTerrain["urbanisme"]>; risques?: Partial<DonneesTerrain["risques"]>; parcelle?: Partial<DonneesTerrain["parcelle"]> };
const t = (p: Patch): DonneesTerrain => ({
  ...base,
  parcelle: { ...base.parcelle, ...p.parcelle },
  urbanisme: { ...base.urbanisme, ...p.urbanisme },
  risques: { ...base.risques, ...p.risques },
});
const voyant = (d: DonneesTerrain, cle: string) => analyserTerrain(d).voyants.find((v) => v.cle === cle)!;
const titres = (d: DonneesTerrain) => analyserTerrain(d).points.map((p) => p.titre);

describe("zone", () => {
  it("lit une zone urbaine comme constructible a priori, jamais comme acquise", () => {
    const z = analyserTerrain(base).zone;
    expect(z.niveau).toBe("favorable");
    expect(z.titre).toBe("Zone UB : Zone urbaine de forte densité");
    expect(z.detail).toContain("a priori");
  });

  it.each([
    ["AUc", "vigilance"],
    ["AUs", "alerte"],
    ["A", "alerte"],
    ["N", "alerte"],
    ["Nh", "vigilance"],
  ])("classe une zone %s en %s", (typezone, niveau) => {
    const d = t({ urbanisme: { zones: [{ libelle: "X", libelong: "", typezone, reglementUrl: null }] } });
    expect(analyserTerrain(d).zone.niveau).toBe(niveau);
  });

  it("retire le code répété en tête du libellé long", () => {
    const d = t({ urbanisme: { zones: [{ libelle: "Uspr", libelong: "Uspr : zone urbaine du SPR", typezone: "U", reglementUrl: null }] } });
    expect(analyserTerrain(d).zone.titre).toBe("Zone Uspr : zone urbaine du SPR");
  });

  it("lit les secteurs de carte communale", () => {
    const cc = (typesect: string) => t({ urbanisme: { zones: [], secteursCC: [{ libelle: "A", typesect, reglementUrl: null }] } });
    expect(analyserTerrain(cc("01")).zone.niveau).toBe("favorable");
    expect(analyserTerrain(cc("03")).zone.niveau).toBe("alerte");
    expect(analyserTerrain(cc("03")).zone.titre).toBe("Carte communale, secteur A");
  });

  it("signale le règlement national d'urbanisme et l'absence de document", () => {
    expect(analyserTerrain(t({ urbanisme: { zones: [], document: null, rnu: true } })).zone.niveau).toBe("vigilance");
    expect(analyserTerrain(t({ urbanisme: { zones: [], document: null, rnu: false } })).zone.niveau).toBe("inconnu");
    expect(analyserTerrain(t({ urbanisme: { etat: "indisponible", zones: [] } })).zone.niveau).toBe("inconnu");
  });

  it("demande un certificat d'urbanisme avant l'achat quand la zone ne permet pas de construire", () => {
    const d = t({ urbanisme: { zones: [{ libelle: "A", libelong: "Zone agricole", typezone: "A", reglementUrl: null }] } });
    const p = analyserTerrain(d).points[0];
    expect(p.titre).toBe("Constructibilité");
    expect(p.texte).toContain("certificat d'urbanisme");
  });
});

describe("inondation", () => {
  it("alerte quand un PPRI couvre la parcelle", () => {
    const d = t({ urbanisme: { servitudes: [{ type: "pm1", nom: "PPRI de Pont-Audemer" }] } });
    expect(voyant(d, "inondation").niveau).toBe("alerte");
    expect(voyant(d, "inondation").resume).toContain("PPRI de Pont-Audemer");
    expect(titres(d)).toContain("Plan de prévention des risques");
  });

  it("alerte quand le PLU porte une mention de zone inondable", () => {
    const d = t({ urbanisme: { informations: [{ libelle: "ZONE PPRI", txt: "" }] } });
    expect(voyant(d, "inondation").niveau).toBe("alerte");
  });

  it("ne confond pas un PPR mouvements de terrain avec l'inondation", () => {
    const d = t({ urbanisme: { servitudes: [{ type: "pm1", nom: "PPR mouvements de terrain des falaises" }] }, risques: { commune: [] } });
    expect(voyant(d, "inondation").niveau).toBe("favorable");
  });

  it("distingue un risque communal d'un risque sur la parcelle", () => {
    expect(voyant(base, "inondation").niveau).toBe("info");
    expect(voyant(t({ risques: { commune: [] } }), "inondation").niveau).toBe("favorable");
  });
});

describe("cavités", () => {
  const cav = (distance: number) => ({ type: "naturelle", nom: "76351-053", distance });

  it("alerte sous 60 m, pour un indice de marnière", () => {
    const d = t({ risques: { cavites: [cav(45), cav(300)] } });
    expect(voyant(d, "cavites").niveau).toBe("alerte");
    expect(voyant(d, "cavites").resume).toContain("45 m");
    expect(titres(d)).toContain("Cavité souterraine");
  });

  it("met en vigilance au-delà, et compte les cavités au pluriel", () => {
    const d = t({ risques: { cavites: [cav(202), cav(300)] } });
    expect(voyant(d, "cavites").niveau).toBe("vigilance");
    expect(voyant(d, "cavites").resume).toMatch(/^2 cavités recensées dans un rayon de 500 m, la plus proche à environ 202 m/);
  });

  it("prévient que la base est incomplète dans les départements de craie", () => {
    expect(voyant(t({ risques: { cavites: [] } }), "cavites").niveau).toBe("info");
    expect(voyant(t({ parcelle: { codeInsee: "33063" }, risques: { cavites: [] } }), "cavites").niveau).toBe("favorable");
  });

  it("alerte sur une mention de cavité dans le PLU, même sans indice dans la base", () => {
    const d = t({ urbanisme: { prescriptions: [{ libelle: "Périmètre de risque lié aux cavités souterraines", txt: "" }] } });
    expect(voyant(d, "cavites").niveau).toBe("alerte");
  });
});

describe("autres contraintes", () => {
  it("demande l'étude de sol en argiles moyennes ou fortes", () => {
    expect(voyant(t({ risques: { argiles: 2 } }), "argiles").niveau).toBe("vigilance");
    expect(titres(t({ risques: { argiles: 3 } }))).toContain("Étude de sol");
    expect(voyant(base, "argiles").niveau).toBe("favorable");
  });

  it("annonce l'avis de l'Architecte des Bâtiments de France", () => {
    const d = t({ urbanisme: { servitudes: [{ type: "ac1", nom: "PDA des monuments historiques du centre ville" }] } });
    expect(voyant(d, "patrimoine").niveau).toBe("vigilance");
    expect(titres(d)).toContain("Architecte des Bâtiments de France");
  });

  it("repère emplacement réservé, espace boisé classé et orientation d'aménagement", () => {
    const d = t({
      urbanisme: {
        prescriptions: [
          { libelle: "EMPLACEMENT RESERVE", txt: "PTR-ER-24" },
          { libelle: "Espace boisé classé", txt: "" },
          { libelle: "OAP Projets de qualité", txt: "" },
        ],
      },
    });
    expect(titres(d)).toEqual(expect.arrayContaining(["Emplacement réservé", "Espace boisé classé", "Orientation d'aménagement"]));
  });

  it("applique les règles parasismiques à partir de la zone 3", () => {
    expect(titres(t({ risques: { sismicite: 3 } }))).toContain("Séisme");
    expect(titres(t({ risques: { sismicite: 2 } }))).not.toContain("Séisme");
  });

  it("finit toujours par le certificat d'urbanisme, et garde la liste courte", () => {
    const tout = t({
      urbanisme: {
        zones: [{ libelle: "AUc", libelong: "", typezone: "AUc", reglementUrl: null }],
        servitudes: [{ type: "pm1", nom: "PPRI" }, { type: "ac4", nom: "SPR" }],
        prescriptions: [{ libelle: "EMPLACEMENT RESERVE", txt: "" }, { libelle: "Espace boisé classé", txt: "" }],
      },
      risques: { argiles: 3, cavites: [{ type: "naturelle", nom: "", distance: 20 }], sismicite: 4, radon: 3 },
    });
    const p = analyserTerrain(tout).points;
    expect(p.length).toBeLessThanOrEqual(7);
    expect(p.at(-1)?.titre).toBe("Avant d'acheter");
    expect(analyserTerrain(base).points.at(-1)?.titre).toBe("Avant d'acheter");
  });
});

describe("sources indisponibles", () => {
  it("ne conclut rien quand les données manquent", () => {
    const d = t({
      urbanisme: { etat: "indisponible", zones: [] },
      risques: { etat: "indisponible", argiles: null, cavites: null, mouvements: null, sismicite: null, radon: null, commune: null },
    });
    const a = analyserTerrain(d);
    expect(a.voyants.every((v) => v.niveau === "inconnu")).toBe(true);
    expect(a.risques[0].valeur).toContain("ne répond pas");
  });
});

describe("mise en forme", () => {
  it("écrit les dates à la française", () => {
    expect(dateFr("20260212")).toBe("12/02/2026");
    expect(dateFr("2026-04-01T16:08:57Z")).toBe("01/04/2026");
    expect(dateFr(null)).toBeNull();
  });

  it("ne répète pas le type d'une servitude ni le code d'une mention", () => {
    expect(libelleServitude({ type: "ac4", nom: "Site patrimonial remarquable de Pont-Audemer" })).toBe("Site patrimonial remarquable de Pont-Audemer");
    expect(libelleServitude({ type: "ac1", nom: "Église Saint-Ouen" })).toBe("Abords d'un monument historique : Église Saint-Ouen");
    expect(libelleServitude({ type: "xx9", nom: "" })).toBe("XX9");
    expect(libelleMention({ libelle: "S3 : Desserte élargie", txt: "S3" })).toBe("S3 : Desserte élargie");
    expect(libelleMention({ libelle: "EMPLACEMENT RESERVE", txt: "PTR-ER-24" })).toBe("EMPLACEMENT RESERVE : PTR-ER-24");
  });

  it("prévient que la fiche est indicative et date la version du PLU", () => {
    const a = analyserTerrain(base);
    expect(a.avertissements[0]).toContain("seul un certificat d'urbanisme");
    expect(a.avertissements[1]).toContain("01/04/2026");
    expect(a.liens.reglement).toContain("#page=116");
    expect(a.liens.geoportail).toContain("lon=0.095900&lat=49.519500");
  });

  it("ne livre dans l'aperçu que la synthèse", () => {
    const ap = apercu(base, analyserTerrain(base));
    expect(ap.reference).toBe("OJ 0646");
    expect(ap.voyants).toHaveLength(5);
    expect(Object.keys(ap)).not.toContain("urbanisme");
  });
});

describe("demande de la fiche complète", () => {
  const corps = { idu: "76351000oj0646", adresse: "28 Rue Léon Hallaure <b>", prenom: "jean-marie", nom: "Durand", email: "Jean@Exemple.fr", consentement: true };

  it("nettoie une demande complète", () => {
    const r = validerDemandeFiche(corps);
    expect("demande" in r && r.demande).toEqual({ idu: "76351000OJ0646", adresse: "28 Rue Léon Hallaure b", prenom: "Jean-Marie", nom: "Durand", email: "jean@exemple.fr" });
  });

  it("refuse une parcelle, un e-mail ou un consentement manquants", () => {
    const r = validerDemandeFiche({ ...corps, idu: "OJ 646", email: "jean@", consentement: "oui" });
    expect("erreurs" in r && Object.keys(r.erreurs).sort()).toEqual(["consentement", "email", "idu"]);
  });
});

describe("e-mails de la fiche", () => {
  const c = { prenom: "Jean", nom: "Durand", email: "jean@exemple.fr" };

  it("résume les alertes et renvoie au site", () => {
    const d = t({ urbanisme: { servitudes: [{ type: "pm1", nom: "PPRI de Pont-Audemer" }] } });
    const m = emailClientFiche(c, d, analyserTerrain(d));
    expect(m.subject).toBe("Votre fiche terrain : parcelle OJ 0646, Le Havre");
    expect(m.html).toContain("Points d'alerte : <strong>inondation</strong>");
    expect(m.html).toContain("utm_source=email&amp;utm_medium=fiche-terrain");
    expect(m.html).toContain("seul un certificat d'urbanisme");
  });

  it("n'écrit « gratuit » nulle part : c'est un déclencheur des filtres anti-spam", () => {
    const client = emailClientFiche(c, base, analyserTerrain(base));
    const interne = emailInterneFiche(c, base, analyserTerrain(base), "28 Rue Léon Hallaure");
    for (const m of [client, interne]) {
      expect(m.subject).not.toMatch(/gratuit|offert/i);
      expect(m.html).not.toMatch(/gratuit|offert/i);
    }
  });

  it("donne à Dursun de quoi rappeler le contact", () => {
    const m = emailInterneFiche(c, base, analyserTerrain(base), "28 Rue Léon Hallaure");
    expect(m.subject).toContain("Jean Durand");
    expect(m.html).toContain("jean@exemple.fr");
    expect(m.html).toContain("rien de particulier");
  });

  it("nomme le PDF sans accent ni espace", () => {
    expect(nomFichierFiche(t({ parcelle: { commune: "Pont-Audemer", section: "AK", numero: "0123" } }))).toBe(
      "permis-maison-individuelle_Fiche-terrain_Pont-Audemer_AK-0123.pdf",
    );
  });
});
