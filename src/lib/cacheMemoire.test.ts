import { describe, expect, it, vi } from "vitest";
import { enCache, oublier } from "./cacheMemoire";

describe("enCache", () => {
  it("ne relit pas le stockage avant l'expiration", async () => {
    const f = vi.fn(async () => 42);
    expect(await enCache("a", f, 1000, 0)).toBe(42);
    expect(await enCache("a", f, 1000, 999)).toBe(42);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("relit le stockage une fois la durée écoulée", async () => {
    const f = vi.fn(async () => 1);
    await enCache("b", f, 1000, 0);
    await enCache("b", f, 1000, 1000);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("ne garde jamais une erreur", async () => {
    const f = vi.fn().mockRejectedValueOnce(new Error("blob")).mockResolvedValueOnce(7);
    await expect(enCache("c", f, 1000, 0)).rejects.toThrow("blob");
    expect(await enCache("c", f, 1000, 1)).toBe(7);
  });

  it("oublier force la relecture (remise à zéro du compteur)", async () => {
    const f = vi.fn(async () => 3);
    await enCache("d", f, 1000, 0);
    oublier("d");
    await enCache("d", f, 1000, 1);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
