import { describe, expect, it } from "vitest";
import { analyserSuites, clePage, decoderSuite, encoderSuite, libellePage, nettoyerSuite } from "./suite";

describe("clePage", () => {
  it("résume une adresse en clé courte", () => {
    expect(clePage("/")).toBe("accueil");
    expect(clePage("/tarifs")).toBe("tarifs");
    expect(clePage("/conseils/recours-des-tiers/")).toBe("conseils--recours-des-tiers");
    expect(clePage("/conseils/a/b/c")).toBe("conseils--a");
  });

  it("écarte les adresses inattendues", () => {
    expect(clePage("/Conseils")).toBeNull();
    expect(clePage("/admin")).toBeNull();
    expect(clePage("/a%20b")).toBeNull();
  });
});

describe("libellePage", () => {
  it("donne un nom lisible", () => {
    expect(libellePage("accueil")).toBe("Accueil");
    expect(libellePage("references-chantiers")).toBe("Réalisations");
    expect(libellePage("conseils--recours-des-tiers")).toBe("Conseils › recours-des-tiers");
    expect(libellePage("inconnue")).toBe("/inconnue");
  });
});

describe("encodage d'une suite", () => {
  it("relit ce qu'il a écrit", () => {
    for (const s of [
      { genre: "page", valeur: "conseils--recours-des-tiers" },
      { genre: "appel", valeur: "tarifs" },
      { genre: "demande", valeur: "contact" },
    ] as const) {
      expect(decoderSuite(encoderSuite(s))).toEqual(s);
    }
  });

  it("refuse ce qui n'est pas une suite", () => {
    expect(nettoyerSuite({ genre: "vol", valeur: "tarifs" })).toBeNull();
    expect(nettoyerSuite({ genre: "page", valeur: "../x" })).toBeNull();
    expect(nettoyerSuite(null)).toBeNull();
    expect(decoderSuite("page")).toBeNull();
  });
});

describe("analyserSuites", () => {
  it("totalise pages vues et contacts après la page Express", () => {
    const a = analyserSuites([
      { genre: "page", valeur: "tarifs" },
      { genre: "page", valeur: "tarifs" },
      { genre: "page", valeur: "accueil" },
      { genre: "appel", valeur: "tarifs" },
      { genre: "demande", valeur: "contact" },
    ]);
    expect(a.pages).toEqual([
      ["tarifs", 2],
      ["accueil", 1],
    ]);
    expect(a.appels).toBe(1);
    expect(a.whatsapp).toBe(0);
    expect(a.demandes).toEqual([["contact", 1]]);
  });
});
