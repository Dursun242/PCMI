import { describe, expect, it } from "vitest";
import {
  cheminCommande,
  compterCommande,
  lireCheminCommande,
  nettoyerEcheances,
  nettoyerFormule,
  parJourCommande,
  repartition,
  tauxConversion,
  type EvenementCommande,
} from "./suiviCommande";

const ev = (e: Partial<EvenementCommande>): EvenementCommande => ({
  jour: "2026-11-02",
  etape: "panier",
  source: "direct",
  instant: 1_793_000_000_000,
  formule: null,
  echeances: null,
  ...e,
});

describe("chemin d'un événement de commande", () => {
  it("se relit à l'identique, formule et échéances comprises", () => {
    const e = ev({ etape: "devis", source: "ads", formule: "complet", echeances: 10 });
    const chemin = cheminCommande(e, "abc");
    expect(chemin).toBe("suivi/commande/2026-11-02/devis/ads/1793000000000-abc_complet-10.txt");
    expect(lireCheminCommande(chemin)).toEqual(e);
  });

  it("garde une étape sans formule ni échéances", () => {
    const e = ev({ etape: "panier" });
    expect(lireCheminCommande(cheminCommande(e, "x"))).toEqual(e);
  });

  it("écarte un chemin inconnu ou abîmé", () => {
    expect(lireCheminCommande("suivi/express/2026-11-02/vue/direct/1-a.txt")).toBeNull();
    expect(lireCheminCommande("suivi/commande/2026-11-02/inconnue/direct/1-a_x-x.txt")).toBeNull();
    expect(lireCheminCommande("suivi/commande/2026-11-02/devis/autre/1-a_x-x.txt")).toBeNull();
  });
});

describe("nettoyage des valeurs reçues", () => {
  it("n'accepte que les formules et nombres d'échéances proposés", () => {
    expect(nettoyerFormule("express")).toBe("express");
    expect(nettoyerFormule("gratuite")).toBeNull();
    expect(nettoyerEcheances(4)).toBe(4);
    expect(nettoyerEcheances(3)).toBeNull();
    expect(nettoyerEcheances("10")).toBeNull();
  });
});

describe("compteurs de commande", () => {
  const evenements = [
    ev({ etape: "panier", jour: "2026-11-01" }),
    ev({ etape: "panier", source: "ads" }),
    ev({ etape: "panier" }),
    ev({ etape: "devis", formule: "complet", echeances: 10 }),
    ev({ etape: "devis", formule: "express", echeances: 4, source: "ads" }),
    ev({ etape: "signee", formule: "complet", echeances: 10 }),
  ];

  it("compte chaque étape, et la part venue des annonces", () => {
    const c = compterCommande(evenements);
    expect(c.etapes.panier).toBe(3);
    expect(c.etapes.devis).toBe(2);
    expect(c.etapes.signee).toBe(1);
    expect(c.ads.panier).toBe(1);
  });

  it("ne compte qu'à partir d'un jour donné", () => {
    expect(compterCommande(evenements, "2026-11-02").etapes.panier).toBe(2);
  });

  it("donne le taux de commandes signées par panier ouvert", () => {
    expect(tauxConversion(compterCommande(evenements))).toBe(33.3);
    expect(tauxConversion(compterCommande([]))).toBeNull();
  });

  it("répartit une étape par formule ou par nombre d'échéances, du plus fréquent au moins fréquent", () => {
    expect(repartition(evenements, "devis", "formule")).toEqual([
      ["complet", 1],
      ["express", 1],
    ]);
    expect(repartition([...evenements, ev({ etape: "devis", formule: "complet", echeances: 10 })], "devis", "echeances")).toEqual([
      ["10", 2],
      ["4", 1],
    ]);
  });

  it("donne les derniers jours, jours vides compris", () => {
    const jours = parJourCommande(evenements, "2026-11-02", 3);
    expect(jours.map((j) => j.jour)).toEqual(["2026-11-02", "2026-11-01", "2026-10-31"]);
    expect(jours[0].compteurs.etapes.panier).toBe(2);
    expect(jours[2].compteurs.etapes.panier).toBe(0);
  });
});
