import { describe, expect, it } from "vitest";
import { evolution, indicateur } from "./tableauDeBord";

describe("indicateurs du tableau de bord", () => {
  const aujourdhui = "2026-11-03";

  it("compte aujourd'hui, les 7 derniers jours et les 7 jours d'avant", () => {
    const jours = [
      "2026-11-03", "2026-11-03", // aujourd'hui
      "2026-10-28", // 6 jours avant : encore dans la semaine
      "2026-10-27", // 7 jours avant : semaine précédente
      "2026-10-21", // 13 jours avant : semaine précédente
      "2026-10-20", // 14 jours avant : hors champ
    ];
    const i = indicateur(jours, aujourdhui);
    expect(i.aujourdhui).toBe(2);
    expect(i.semaine).toBe(3);
    expect(i.semainePrecedente).toBe(2);
  });

  it("donne une série de 14 jours, du plus ancien au plus récent, jours vides compris", () => {
    const i = indicateur(["2026-11-03", "2026-10-21", "2026-10-21"], aujourdhui);
    expect(i.serie).toHaveLength(14);
    expect(i.serie[0]).toBe(2);
    expect(i.serie[13]).toBe(1);
    expect(i.serie.slice(1, 13).every((n) => n === 0)).toBe(true);
  });

  it("dit l'évolution par rapport à la semaine d'avant", () => {
    expect(evolution({ semaine: 5, semainePrecedente: 2 })).toEqual({ sens: "hausse", texte: "+3 sur 7 j" });
    expect(evolution({ semaine: 1, semainePrecedente: 4 })).toEqual({ sens: "baisse", texte: "−3 sur 7 j" });
    expect(evolution({ semaine: 2, semainePrecedente: 2 })).toEqual({ sens: "stable", texte: "Stable sur 7 j" });
    expect(evolution({ semaine: 0, semainePrecedente: 0 })).toEqual({ sens: "stable", texte: "Rien sur 14 j" });
  });
});
