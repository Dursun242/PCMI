import { describe, expect, test } from "vitest";
import { sansMesureTierce } from "./mesureTierce";

describe("pages sans mesure extérieure", () => {
  test("admin et tout le parcours DP piscine", () => {
    expect(sansMesureTierce("/admin")).toBe(true);
    expect(sansMesureTierce("/admin/express")).toBe(true);
    expect(sansMesureTierce("/dp-piscine")).toBe(true);
    expect(sansMesureTierce("/dp-piscine/suivi")).toBe(true);
  });

  test("le reste du site reste mesuré", () => {
    expect(sansMesureTierce("/")).toBe(false);
    expect(sansMesureTierce("/permis-express")).toBe(false);
    expect(sansMesureTierce("/dp-piscine-guide")).toBe(false);
  });
});
