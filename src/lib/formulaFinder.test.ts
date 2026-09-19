import { describe, expect, it } from "vitest";
import { recommend, SURFACE_MAX, type Answers } from "./formulaFinder";

const base: Answers = { surface: 110, contraintes: "non", rendus3dEtRe2020: false };
const a = (over: Partial<Answers>): Answers => ({ ...base, ...over });

describe("recommend", () => {
  it("ne recommande rien tant qu'une réponse manque", () => {
    expect(recommend(a({ surface: null }))).toBeNull();
    expect(recommend(a({ contraintes: null }))).toBeNull();
    expect(recommend(a({ rendus3dEtRe2020: null }))).toBeNull();
  });

  it("recommande Essentiel sur un terrain simple sans besoin de rendus", () => {
    const r = recommend(base);
    expect(r?.planId).toBe("essentiel");
    expect(r?.href).toBe("/devis?formule=essentiel&surface=110");
    expect(r?.rationale).toHaveLength(2);
  });

  it("recommande Complet quand le terrain est contraint", () => {
    expect(recommend(a({ contraintes: "oui" }))?.planId).toBe("complet");
  });

  it("recommande Complet quand le porteur de projet ne connaît pas ses contraintes", () => {
    expect(recommend(a({ contraintes: "je-ne-sais-pas" }))?.planId).toBe("complet");
  });

  it("recommande Complet pour les rendus 3D et la RE2020 sur un terrain simple", () => {
    expect(recommend(a({ rendus3dEtRe2020: true }))?.planId).toBe("complet");
  });

  it("recommande Premium quand le terrain est contraint et les rendus nécessaires", () => {
    const r = recommend(a({ contraintes: "oui", rendus3dEtRe2020: true }));
    expect(r?.planId).toBe("premium");
    expect(r?.href).toBe("/devis?formule=premium&surface=110");
  });

  it("bascule sur devis au-delà de la limite des formules", () => {
    const r = recommend(a({ surface: SURFACE_MAX + 1 }));
    expect(r?.planId).toBeNull();
    expect(r?.planName).toBe("Devis sur mesure");
    expect(r?.href).toBe("/devis?surface=150");
  });

  it("garde la limite des formules inclusive", () => {
    expect(recommend(a({ surface: SURFACE_MAX }))?.planId).toBe("essentiel");
  });

  it("mentionne l'architecte obligatoire seulement à partir de 150 m²", () => {
    expect(recommend(a({ surface: 150 }))?.rationale[1]).toContain("architecte");
    // Entre 149 et 150 m² exclus il n'existe pas d'entier : on vérifie une valeur décimale.
    expect(recommend(a({ surface: 149.5 }))?.rationale[1]).not.toContain("architecte");
  });
});
