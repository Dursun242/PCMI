import { describe, expect, it } from "vitest";
import { calculerTaxe, TA_2026, type TaxeSaisie } from "./taxeAmenagement";

const base: TaxeSaisie = {
  surfaceTaxable: 120,
  residencePrincipale: true,
  ileDeFrance: false,
  tauxCommunal: 5,
  tauxDepartemental: 2.5,
  tauxRegional: 0,
  piscineM2: 0,
  placesStationnement: 0,
  archeologie: true,
};
const s = (over: Partial<TaxeSaisie>): TaxeSaisie => ({ ...base, ...over });

describe("calculerTaxe", () => {
  it("reproduit l'exemple de service-public (50 m², 3 % + 2,5 %, sans abattement)", () => {
    const r = calculerTaxe(s({ surfaceTaxable: 50, residencePrincipale: false, tauxCommunal: 3, archeologie: false }));
    expect(r?.base).toBe(44_600);
    expect(r?.partCommunale).toBe(1_338);
    expect(r?.partDepartementale).toBe(1_115);
    expect(r?.taxeAmenagement).toBe(2_453);
  });

  it("applique l'abattement de 50 % sur les 100 premiers m² d'une résidence principale", () => {
    const r = calculerTaxe(base);
    // 100 m² × 446 € + 20 m² × 892 €
    expect(r?.baseConstruction).toBe(100 * 446 + 20 * 892);
    expect(r?.taxeAmenagement).toBe(Math.round(r!.baseConstruction * 0.075));
  });

  it("n'applique pas l'abattement à une résidence secondaire", () => {
    expect(calculerTaxe(s({ residencePrincipale: false }))?.baseConstruction).toBe(120 * 892);
  });

  it("prend la valeur d'Île-de-France et ajoute la part régionale", () => {
    const r = calculerTaxe(s({ surfaceTaxable: 80, ileDeFrance: true, tauxRegional: 1 }));
    expect(r?.baseConstruction).toBe(80 * TA_2026.valeurM2.idf * 0.5);
    expect(r?.partRegionale).toBe(Math.round(r!.base * 0.01));
  });

  it("ignore la part régionale hors Île-de-France", () => {
    expect(calculerTaxe(s({ tauxRegional: 1 }))?.partRegionale).toBe(0);
  });

  it("ajoute la piscine et les places de stationnement extérieures", () => {
    const r = calculerTaxe(s({ piscineM2: 32, placesStationnement: 2 }));
    expect(r?.baseAmenagements).toBe(32 * 251 + 2 * 2_928);
    expect(r?.base).toBe(r!.baseConstruction + r!.baseAmenagements);
  });

  it("calcule la taxe d'archéologie préventive à 0,40 % de la même base", () => {
    const r = calculerTaxe(base);
    expect(r?.archeologie).toBe(Math.round(r!.base * 0.004));
    expect(r?.total).toBe(r!.taxeAmenagement + r!.archeologie);
    expect(calculerTaxe(s({ archeologie: false }))?.archeologie).toBe(0);
  });

  it("exonère une construction de 5 m² ou moins", () => {
    const r = calculerTaxe(s({ surfaceTaxable: 5 }));
    expect(r?.baseConstruction).toBe(0);
    expect(r?.total).toBe(0);
  });

  it("demande un paiement unique jusqu'à 1 500 €", () => {
    const r = calculerTaxe(s({ surfaceTaxable: 40, tauxCommunal: 3, tauxDepartemental: 1 }));
    expect(r!.taxeAmenagement).toBeLessThanOrEqual(1_500);
    expect(r?.echeances).toHaveLength(1);
    expect(r?.echeances[0].montant).toBe(r!.taxeAmenagement);
  });

  it("divise en deux parts égales au-delà de 1 500 €", () => {
    const r = calculerTaxe(base);
    expect(r!.taxeAmenagement).toBeGreaterThan(1_500);
    expect(r?.echeances).toHaveLength(2);
    expect(r!.echeances[0].montant + r!.echeances[1].montant).toBe(r!.taxeAmenagement);
  });

  it("refuse une saisie hors des bornes légales", () => {
    expect(calculerTaxe(s({ surfaceTaxable: -1 }))).toBeNull();
    expect(calculerTaxe(s({ tauxCommunal: 21 }))).toBeNull();
    expect(calculerTaxe(s({ tauxDepartemental: 2.6 }))).toBeNull();
    expect(calculerTaxe(s({ ileDeFrance: true, tauxRegional: 1.1 }))).toBeNull();
    expect(calculerTaxe(s({ placesStationnement: 1.5 }))).toBeNull();
    expect(calculerTaxe(s({ surfaceTaxable: Number.NaN }))).toBeNull();
  });
});
