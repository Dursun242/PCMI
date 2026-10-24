import { describe, expect, it } from "vitest";
import { eligibleExpress, estUrgente, libelle, lireDemande, TYPES_MAISON, verdictExpress } from "./express";

const base = {
  name: "Jean Martin",
  phone: "06 12 34 56 78",
  email: "jean@example.fr",
  city: "Montivilliers 76290",
  typeMaison: "plain-pied",
  surface: "98",
  terrain: "compromis",
  echeance: "2-semaines",
  rendezVous: "bureau",
  message: "3 chambres",
  consent: "on",
};

describe("lireDemande", () => {
  it("accepte une demande complète et normalise la surface", () => {
    const r = lireDemande(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.demande.surface).toBe(98);
      expect(r.demande.terrain).toBe("compromis");
    }
  });

  it("refuse une demande sans nom, sans commune ou sans téléphone exploitable", () => {
    expect(lireDemande({ ...base, name: " " }).ok).toBe(false);
    expect(lireDemande({ ...base, city: "" }).ok).toBe(false);
    expect(lireDemande({ ...base, phone: "06 12" }).ok).toBe(false);
  });

  it("exige l'e-mail et refuse une adresse mal formée", () => {
    expect(lireDemande({ ...base, email: "" })).toEqual({ ok: false, error: "Merci d'indiquer votre adresse e-mail." });
    expect(lireDemande({ ...base, email: "jean@" }).ok).toBe(false);
    expect(lireDemande(base).ok).toBe(true);
  });

  it("exige le consentement", () => {
    expect(lireDemande({ ...base, consent: undefined }).ok).toBe(false);
  });

  it("écarte les valeurs hors liste et un gclid fantaisiste", () => {
    const r = lireDemande({ ...base, typeMaison: "<script>", gclid: "x y<>" });
    expect(r.ok && r.demande.typeMaison).toBe("");
    expect(r.ok && r.demande.gclid).toBe("");
  });

  it("garde un gclid bien formé", () => {
    const r = lireDemande({ ...base, gclid: "Cj0KCQjw_abc-123XYZ" });
    expect(r.ok && r.demande.gclid).toBe("Cj0KCQjw_abc-123XYZ");
  });
});

describe("eligibleExpress", () => {
  it("retient toute maison jusqu'à 150 m², plain-pied ou à étage", () => {
    expect(eligibleExpress({ surface: 150 })).toBe(true);
    expect(eligibleExpress({ surface: 98 })).toBe(true);
  });

  it("écarte une maison au-delà de 150 m² ou sans surface connue", () => {
    expect(eligibleExpress({ surface: 151 })).toBe(false);
    expect(eligibleExpress({ surface: null })).toBe(false);
  });
});

describe("verdictExpress", () => {
  it("retient une maison dans la surface, quel que soit le nombre de niveaux", () => {
    expect(verdictExpress({ surface: 140 })).toBe("eligible");
  });

  it("écarte seulement une maison trop grande", () => {
    expect(verdictExpress({ surface: 180 })).toBe("hors");
  });

  it("laisse à vérifier une demande sans surface (le formulaire ne la demande plus)", () => {
    expect(verdictExpress({ surface: null })).toBe("a-verifier");
  });
});

describe("estUrgente", () => {
  it("signale une date butoir proche ou un compromis", () => {
    expect(estUrgente({ echeance: "1-mois", terrain: "achete" })).toBe(true);
    expect(estUrgente({ echeance: "pas-urgent", terrain: "compromis" })).toBe(true);
    expect(estUrgente({ echeance: "3-mois", terrain: "recherche" })).toBe(false);
  });
});

describe("libelle", () => {
  it("rend le libellé d'un choix et un repli pour une valeur vide", () => {
    expect(libelle(TYPES_MAISON, "plain-pied")).toBe("Plain-pied");
    expect(libelle(TYPES_MAISON, "")).toBe("Non précisé");
  });
});
