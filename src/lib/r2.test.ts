import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ENV = { CLOUDFLARE_ACCOUNT_ID: "acc", R2_ACCESS_KEY_ID: "id", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET: "seau" };

describe("fichiers Cloudflare R2", () => {
  test("configuré seulement avec les quatre variables", async () => {
    const { r2Configure } = await import("./r2");
    expect(r2Configure(ENV)).toBe(true);
    expect(r2Configure({ ...ENV, R2_BUCKET: "" })).toBe(false);
  });

  test("chemins acceptés et refusés", async () => {
    const { cheminValide } = await import("./r2");
    expect(cheminValide("dp-piscine-fichiers/abc/1f2e-DP_X_DP.pdf")).toBe(true);
    expect(cheminValide("envois/1-plan.pdf")).toBe(true);
    for (const c of ["../secret", "/racine.pdf", "a//b", "a/../b", "espace dans.pdf", ""]) expect(cheminValide(c)).toBe(false);
  });

  test("adresse d'envoi signée pour le compartiment, type signé, 10 minutes", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    const { r2AdresseEnvoi } = await import("./r2");
    const { envoi, url } = await r2AdresseEnvoi("envois/1-plan.pdf", "application/pdf");
    const u = new URL(envoi);
    expect(u.host).toBe("acc.r2.cloudflarestorage.com");
    expect(u.pathname).toBe("/seau/envois/1-plan.pdf");
    expect(u.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(u.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
    expect(u.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url).toMatch(/\/api\/fichiers\/envois\/1-plan\.pdf$/);
    vi.unstubAllEnvs();
  });
});
