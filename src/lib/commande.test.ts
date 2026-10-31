import { describe, expect, it } from "vitest";
import { plans } from "@/config/site";
import {
  calculerPanier,
  echeancier,
  echeanciersPossibles,
  formatCentimes,
  optionsCommande,
  validerCommande,
  validerCoordonnees,
} from "./commande";

const prix = (id: string) => plans.find((p) => p.id === id)!.priceTTC;
const option = (id: string) => optionsCommande.find((o) => o.id === id)!;

describe("calculerPanier", () => {
  it("reprend le prix de la formule depuis la configuration", () => {
    const panier = calculerPanier({ formule: "complet", options: {} });
    expect(panier?.totalTTC).toBe(prix("complet"));
    expect(panier?.lignes).toHaveLength(1);
  });

  it("additionne les options et leur quantité", () => {
    const panier = calculerPanier({ formule: "essentiel", options: { "rendu-3d": 2, "attestation-re2020": 1 } });
    expect(panier?.totalTTC).toBe(prix("essentiel") + 2 * option("rendu-3d").priceTTC + option("attestation-re2020").priceTTC);
    expect(panier?.lignes).toHaveLength(3);
  });

  it("ignore les options à zéro", () => {
    const panier = calculerPanier({ formule: "premium", options: { "rendu-3d": 0 } });
    expect(panier?.lignes).toHaveLength(1);
  });

  it("refuse une formule inconnue", () => {
    expect(calculerPanier({ formule: "express", options: {} })).toBeNull();
    expect(calculerPanier(null)).toBeNull();
    expect(calculerPanier("complet")).toBeNull();
  });

  it("refuse une option déjà incluse dans la formule", () => {
    expect(calculerPanier({ formule: "complet", options: { "attestation-re2020": 1 } })).toBeNull();
    expect(calculerPanier({ formule: "premium", options: { "eaux-pluviales": 1 } })).toBeNull();
  });

  it("refuse une option inconnue ou une quantité invalide", () => {
    expect(calculerPanier({ formule: "complet", options: { "permis-modificatif": 1 } })).toBeNull();
    expect(calculerPanier({ formule: "complet", options: { "rendu-3d": 99 } })).toBeNull();
    expect(calculerPanier({ formule: "complet", options: { "rendu-3d": 1.5 } })).toBeNull();
    expect(calculerPanier({ formule: "complet", options: { "rendu-3d": -1 } })).toBeNull();
  });

  it("ne se fie jamais à un prix envoyé par le navigateur", () => {
    const panier = calculerPanier({ formule: "complet", options: {}, totalTTC: 1 });
    expect(panier?.totalTTC).toBe(prix("complet"));
  });
});

describe("echeanciersPossibles", () => {
  it("propose 1, 4 et 10 fois pour chaque formule seule", () => {
    for (const p of plans) {
      expect(echeanciersPossibles(p.priceTTC).map((e) => e.nombre)).toEqual([1, 4, 10]);
    }
  });

  it("calcule des mensualités exactes au centime", () => {
    expect(echeanciersPossibles(1990)).toEqual([
      { nombre: 1, montantCentimes: 199000 },
      { nombre: 4, montantCentimes: 49750 },
      { nombre: 10, montantCentimes: 19900 },
    ]);
  });

  it("écarte un échéancier qui ne tombe pas juste", () => {
    expect(echeanciersPossibles(1001.01).map((e) => e.nombre)).toEqual([1]);
  });
});

describe("echeancier", () => {
  it("renvoie l'échéancier choisi s'il est proposé", () => {
    expect(echeancier(1990, 4)).toEqual({ nombre: 4, montantCentimes: 49750 });
  });

  it("refuse un nombre d'échéances non proposé", () => {
    expect(echeancier(1990, 3)).toBeNull();
    expect(echeancier(1990, "10")).toBeNull();
    expect(echeancier(1001.01, 10)).toBeNull();
  });
});

describe("formatCentimes", () => {
  it("affiche les centimes seulement quand il y en a", () => {
    expect(formatCentimes(49750).replace(/\s/g, " ")).toBe("497,50 €");
    expect(formatCentimes(19900).replace(/\s/g, " ")).toBe("199 €");
  });
});

const coordonneesValides = {
  prenom: "Marie",
  nom: "Martin",
  email: "marie@example.fr",
  telephone: "06 12 34 56 78",
  adresse: "12 rue des Lilas",
  codePostal: "76600",
  ville: "Le Havre",
  terrainAdresse: "Chemin du Bois",
  terrainCodePostal: "76290",
  terrainCommune: "Montivilliers",
  surface: "120",
  referenceCadastrale: "",
};

describe("validerCommande", () => {
  const commande = { panier: { formule: "complet", options: {} }, coordonnees: coordonneesValides, echeances: 4 };

  it("accepte une commande complète et recalcule l'échéancier", () => {
    const r = validerCommande(commande);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.commande.panier.totalTTC).toBe(prix("complet"));
      expect(r.commande.echeancier).toEqual({ nombre: 4, montantCentimes: (prix("complet") * 100) / 4 });
    }
  });

  it("refuse un panier invalide", () => {
    expect(validerCommande({ ...commande, panier: { formule: "inconnue" } }).ok).toBe(false);
  });

  it("refuse des coordonnées incomplètes en renvoyant le message utile", () => {
    const r = validerCommande({ ...commande, coordonnees: { ...coordonneesValides, email: "" } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toMatch(/e-mail/);
  });

  it("refuse un nombre d'échéances non proposé", () => {
    expect(validerCommande({ ...commande, echeances: 3 }).ok).toBe(false);
  });

  it("refuse une entrée qui n'est pas un objet", () => {
    expect(validerCommande(undefined).ok).toBe(false);
  });
});

describe("validerCoordonnees", () => {
  const valides = {
    prenom: "Marie",
    nom: "Martin",
    email: "marie@example.fr",
    telephone: "06 12 34 56 78",
    adresse: "12 rue des Lilas",
    codePostal: "76600",
    ville: "Le Havre",
    terrainAdresse: "Chemin du Bois",
    terrainCodePostal: "76290",
    terrainCommune: "Montivilliers",
    surface: "120",
    referenceCadastrale: "",
  };

  it("accepte des coordonnées complètes et les nettoie", () => {
    const r = validerCoordonnees({ ...valides, prenom: "  Marie " });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.coordonnees.prenom).toBe("Marie");
      expect(r.coordonnees.surface).toBe(120);
    }
  });

  it("exige l'adresse du terrain", () => {
    const r = validerCoordonnees({ ...valides, terrainCommune: "" });
    expect(r.ok).toBe(false);
  });

  it("refuse un e-mail, un code postal ou un téléphone invalides", () => {
    expect(validerCoordonnees({ ...valides, email: "marie" }).ok).toBe(false);
    expect(validerCoordonnees({ ...valides, codePostal: "7660" }).ok).toBe(false);
    expect(validerCoordonnees({ ...valides, terrainCodePostal: "ABCDE" }).ok).toBe(false);
    expect(validerCoordonnees({ ...valides, telephone: "123" }).ok).toBe(false);
  });

  it("refuse une surface hors formules (au-delà de 149 m²)", () => {
    const r = validerCoordonnees({ ...valides, surface: "180" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toMatch(/149/);
    expect(validerCoordonnees({ ...valides, surface: "" }).ok).toBe(false);
  });

  it("refuse une entrée qui n'est pas un objet", () => {
    expect(validerCoordonnees(null).ok).toBe(false);
  });
});
