import { describe, expect, test } from "vitest";
import { cheminDp, compterDp, estEtapeDp, lireCheminDp, PREFIXE_DP } from "./suiviDp";

describe("compteur du parcours DP piscine", () => {
  test("un chemin se relit en jour et étape", () => {
    const c = cheminDp("lancee", "2026-11-07", "abc");
    expect(c).toBe(`${PREFIXE_DP}2026-11-07/lancee/abc`);
    expect(lireCheminDp(c)).toEqual({ jour: "2026-11-07", etape: "lancee" });
  });

  test("les chemins étrangers ou abîmés sont ignorés", () => {
    expect(lireCheminDp("suivi/express/2026-11-07/vue/ads/1-a.txt")).toBeNull();
    expect(lireCheminDp(`${PREFIXE_DP}2026-11-07/inconnue/abc`)).toBeNull();
    expect(lireCheminDp(`${PREFIXE_DP}hier/vue/abc`)).toBeNull();
  });

  test("seules les étapes connues sont acceptées", () => {
    expect(estEtapeDp("paye")).toBe(true);
    expect(estEtapeDp("demande")).toBe(false);
    expect(estEtapeDp(3)).toBe(false);
  });

  test("compte par étape, sur toute la période ou depuis un jour", () => {
    const evts = [
      { jour: "2026-11-01", etape: "vue" as const },
      { jour: "2026-11-06", etape: "vue" as const },
      { jour: "2026-11-07", etape: "terrain" as const },
    ];
    expect(compterDp(evts)).toMatchObject({ vue: 2, terrain: 1, paye: 0 });
    expect(compterDp(evts, "2026-11-06")).toMatchObject({ vue: 1, terrain: 1 });
  });
});
