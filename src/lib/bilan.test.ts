import { describe, expect, it } from "vitest";
import { analyser, decoderBilan, encoderBilan, nettoyerBilan, trancheTemps, type Bilan } from "./bilan";

const bilan = (b: Partial<Bilan> = {}): Bilan => ({
  temps: "temps-1min",
  appareil: "telephone",
  sections: [],
  faq: [],
  clics: [],
  abandon: null,
  envoye: false,
  sortie: null,
  ...b,
});

describe("trancheTemps", () => {
  it("range une durée dans sa tranche", () => {
    expect(trancheTemps(3_000)).toBe("temps-10s");
    expect(trancheTemps(10_000)).toBe("temps-30s");
    expect(trancheTemps(45_000)).toBe("temps-1min");
    expect(trancheTemps(120_000)).toBe("temps-3min");
    expect(trancheTemps(600_000)).toBe("temps-plus");
  });
});

describe("encodage", () => {
  it("relit ce qu'il a écrit", () => {
    const b = bilan({
      sections: ["formulaire", "maisons"],
      faq: ["etage", "delai"],
      clics: ["hero-appel", "relance1-devis"],
      abandon: "phone",
    });
    const code = encoderBilan(b);
    expect(code).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(decoderBilan(code)).toEqual(b);
  });

  it("garde un bilan minimal court", () => {
    expect(encoderBilan(bilan())).toBe("ttemps-1min_atelephone");
    expect(decoderBilan("ttemps-1min_atelephone_e1")).toEqual(bilan({ envoye: true }));
  });

  it("écarte les valeurs inconnues et refuse un bilan sans temps ni appareil", () => {
    expect(decoderBilan("ttemps-1min_atelephone_sformulaire.inconnue_cpirate-appel")).toEqual(bilan({ sections: ["formulaire"] }));
    expect(decoderBilan("atelephone")).toBeNull();
    expect(decoderBilan("ttemps-1min_afrigo")).toBeNull();
  });
});

describe("sortie vers le reste du site", () => {
  it("relit la sortie qu'il a écrite", () => {
    const b = bilan({ clics: ["pied-appel"], sortie: { zone: "entete", page: "conseils--recours-des-tiers" } });
    expect(encoderBilan(b)).toContain("_oentete.conseils--recours-des-tiers");
    expect(decoderBilan(encoderBilan(b))).toEqual(b);
  });

  it("écarte une sortie mal formée", () => {
    expect(nettoyerBilan({ ...bilan(), sortie: { zone: "toit", page: "tarifs" } })?.sortie).toBeNull();
    expect(nettoyerBilan({ ...bilan(), sortie: { zone: "pied", page: "../x" } })?.sortie).toBeNull();
  });

  it("compte les sorties par page et par emplacement", () => {
    const a = analyser([
      bilan({ sortie: { zone: "entete", page: "tarifs" } }),
      bilan({ sortie: { zone: "pied", page: "tarifs" } }),
      bilan(),
    ]);
    expect(a.sorties.total).toBe(2);
    expect(a.sorties.pages).toEqual([["tarifs", 2]]);
    expect(a.sorties.zones).toMatchObject({ entete: 1, pied: 1, page: 0 });
  });
});

describe("nettoyerBilan", () => {
  it("accepte un bilan du navigateur et en retire le superflu", () => {
    const brut = {
      temps: "temps-plus",
      appareil: "ordinateur",
      sections: ["fin", "fin", "x"],
      faq: ["mairie", 3],
      clics: ["bas-appel"],
      abandon: "email",
      envoye: false,
    };
    expect(nettoyerBilan(brut)).toEqual(
      bilan({ temps: "temps-plus", appareil: "ordinateur", sections: ["fin"], faq: ["mairie"], clics: ["bas-appel"], abandon: "email" }),
    );
  });

  it("ignore un abandon quand le formulaire est envoyé", () => {
    expect(nettoyerBilan({ ...bilan(), abandon: "phone", envoye: true })?.abandon).toBeNull();
  });

  it("refuse ce qui n'est pas un bilan", () => {
    expect(nettoyerBilan(null)).toBeNull();
    expect(nettoyerBilan("t")).toBeNull();
    expect(nettoyerBilan({ temps: "longtemps", appareil: "telephone" })).toBeNull();
  });
});

describe("analyser", () => {
  it("totalise sections, questions, clics, abandons et appareils", () => {
    const a = analyser([
      bilan({ sections: ["formulaire", "maisons"], faq: ["etage"], clics: ["hero-appel"], envoye: true }),
      bilan({ appareil: "ordinateur", sections: ["formulaire"], abandon: "city" }),
      bilan({ faq: ["etage", "delai"], clics: ["hero-appel", "barre-devis"] }),
    ]);
    expect(a.visites).toBe(3);
    expect(a.sections.formulaire).toBe(2);
    expect(a.sections.maisons).toBe(1);
    expect(a.faq).toMatchObject({ etage: 2, delai: 1 });
    expect(a.clics).toMatchObject({ "hero-appel": 2, "barre-devis": 1 });
    expect(a.abandons.city).toBe(1);
    expect(a.appareils.telephone).toEqual({ visites: 2, envois: 1, appels: 2 });
    expect(a.appareils.ordinateur).toEqual({ visites: 1, envois: 0, appels: 0 });
  });
});
