import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { urlPublique } from "./blobPublic";

describe("adresse publique d'un fichier Blob", () => {
  test("déduite du jeton, comme le SDK", () => {
    expect(urlPublique("dp-piscine/x.json", { BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_AbC123xyz_SecretPart" })).toBe(
      "https://abc123xyz.public.blob.vercel-storage.com/dp-piscine/x.json",
    );
  });
  test("sans jeton ou jeton mal formé : pas d'adresse", () => {
    expect(urlPublique("x", {})).toBeNull();
    expect(urlPublique("x", { BLOB_READ_WRITE_TOKEN: "n'importe-quoi" })).toBeNull();
  });
});
