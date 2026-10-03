import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { checkPassword, createSessionToken, safeAdminRedirect, verifySessionToken } from "./adminAuth";

describe("checkPassword", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "correct horse battery staple";
  });
  afterEach(() => {
    delete process.env.ADMIN_PASSWORD;
  });

  test("accepte le bon mot de passe", async () => {
    expect(await checkPassword("correct horse battery staple")).toBe(true);
  });

  test("refuse un mot de passe faux, plus court ou plus long", async () => {
    expect(await checkPassword("correct horse battery stapl")).toBe(false);
    expect(await checkPassword("x")).toBe(false);
    expect(await checkPassword("correct horse battery staple!")).toBe(false);
  });

  test("refuse tout quand ADMIN_PASSWORD n'est pas configuré", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(await checkPassword("")).toBe(false);
  });
});

describe("jeton de session", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = "mot-de-passe";
  });
  afterEach(() => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
  });

  test("un jeton fraîchement créé est valide", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  test("un jeton modifié est refusé", async () => {
    const token = await createSessionToken();
    const [payload, sig] = token.split(".");
    expect(await verifySessionToken(`${payload}x.${sig}`)).toBe(false);
    expect(await verifySessionToken("")).toBe(false);
    expect(await verifySessionToken("abc")).toBe(false);
  });

  test("signe avec ADMIN_SESSION_SECRET quand il est défini, indépendamment du mot de passe", async () => {
    const signedWithPassword = await createSessionToken();
    process.env.ADMIN_SESSION_SECRET = "a".repeat(48);

    expect(await verifySessionToken(signedWithPassword)).toBe(false);
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });
});

describe("safeAdminRedirect", () => {
  test("garde les chemins internes à l'espace admin", () => {
    expect(safeAdminRedirect("/admin/articles")).toBe("/admin/articles");
    expect(safeAdminRedirect("/admin")).toBe("/admin");
    expect(safeAdminRedirect("/admin/articles/mon-slug?x=1")).toBe("/admin/articles/mon-slug?x=1");
  });

  test("renvoie /admin pour toute destination externe ou douteuse", () => {
    for (const next of [null, "", "https://evil.example", "//evil.example", "/\\evil.example", "/administrateur", "/conseils", "javascript:alert(1)", "/admin/../../evil"]) {
      expect(safeAdminRedirect(next)).toBe("/admin");
    }
  });
});
