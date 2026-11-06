import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ENV = { CLOUDFLARE_ACCOUNT_ID: "acc", CLOUDFLARE_D1_ID: "db", CLOUDFLARE_D1_TOKEN: "jeton" };

function reponse(result: unknown[], ok = true, errors: { message: string }[] = []) {
  return new Response(JSON.stringify({ success: ok, errors, result }), { status: ok ? 200 : 400 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("base Cloudflare D1", () => {
  test("configurée seulement avec les trois variables", async () => {
    const { d1Configure } = await import("./d1");
    expect(d1Configure(ENV)).toBe(true);
    expect(d1Configure({ ...ENV, CLOUDFLARE_D1_TOKEN: "" })).toBe(false);
  });

  test("requête envoyée à l'API REST avec le jeton et les paramètres", async () => {
    const f = vi.fn(async () => reponse([{ results: [{ valeur: '{"a":1}' }] }]));
    vi.stubGlobal("fetch", f);
    const { requete } = await import("./d1");
    const r = await requete("SELECT valeur FROM documents WHERE cle = ?", ["k"], ENV);
    expect(r.results[0].valeur).toBe('{"a":1}');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/acc/d1/database/db/query");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jeton");
    expect(JSON.parse(String(init.body))).toEqual({ sql: "SELECT valeur FROM documents WHERE cle = ?", params: ["k"] });
  });

  test("tables manquantes : schéma créé puis requête rejouée", async () => {
    let n = 0;
    const f = vi.fn(async () => (n++ === 0 ? reponse([], false, [{ message: "no such table: documents" }]) : reponse([{ results: [] }])));
    vi.stubGlobal("fetch", f);
    const { requete } = await import("./d1");
    await requete("SELECT 1 FROM documents", [], ENV);
    const sqls = f.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)).sql as string);
    expect(sqls[0]).toBe("SELECT 1 FROM documents");
    expect(sqls.filter((s) => s.startsWith("CREATE"))).toHaveLength(3);
    expect(sqls.at(-1)).toBe("SELECT 1 FROM documents");
  });

  test("autre erreur : remontée telle quelle", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reponse([], false, [{ message: "Authentication error" }])));
    const { requete } = await import("./d1");
    await expect(requete("SELECT 1", [], ENV)).rejects.toThrow("D1 : Authentication error");
  });

  test("événements écrits par lots de 50 lignes (100 paramètres au plus)", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    const f = vi.fn(async () => reponse([{ results: [] }]));
    vi.stubGlobal("fetch", f);
    const { evtAjouterLot } = await import("./d1");
    await evtAjouterLot(Array.from({ length: 120 }, (_, i) => ({ chemin: `suivi/x/${i}`, instant: i })));
    const params = f.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)).params as unknown[]);
    expect(params.map((p) => p.length)).toEqual([100, 100, 40]);
  });

  test("recherche par préfixe sans LIKE (bornes de plage)", async () => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
    const f = vi.fn(async () => reponse([{ results: [{ chemin: "suivi/express/a" }] }]));
    vi.stubGlobal("fetch", f);
    const { evtChemins } = await import("./d1");
    const r = await evtChemins("suivi/express/", 10);
    expect(r).toEqual({ chemins: ["suivi/express/a"], tronque: false });
    const corps = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(corps.params).toEqual(["suivi/express/", "suivi/express/￿", 11]);
  });
});
