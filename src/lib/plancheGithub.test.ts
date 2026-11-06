import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { estimer, messageEchecGithub } = await import("./plancheGithub");

const base = { depot: "Dursun242/id-plans", ref: "main", corps: '{"message":"Not Found"}', portees: null };

describe("messageEchecGithub", () => {
  it("dit que le jeton à grain fin ne voit pas le dépôt quand le dépôt lui-même est en 404", () => {
    const m = messageEchecGithub({ ...base, statut: 404, statutDepot: 404 });
    expect(m).toContain("HTTP 404 sur Dursun242/id-plans");
    expect(m).toContain("ne voit pas le dépôt");
  });

  it("repère un jeton classique sans la portée repo", () => {
    const m = messageEchecGithub({ ...base, statut: 404, statutDepot: 404, portees: "workflow" });
    expect(m).toContain("Jeton classique");
    expect(m).toContain("« workflow »");
  });

  it("dit que le workflow manque quand le dépôt est visible", () => {
    const m = messageEchecGithub({ ...base, statut: 404, statutDepot: 200 });
    expect(m).toContain("workflow planche-gratuite.yml est introuvable sur main");
  });

  it("signale un jeton invalide et un droit Actions manquant", () => {
    expect(messageEchecGithub({ ...base, statut: 401, statutDepot: null })).toContain("invalide ou expiré");
    expect(messageEchecGithub({ ...base, statut: 403, statutDepot: null })).toContain("Actions : Read and write");
  });
});

describe("estimer (DP piscine, dessin interrompu)", () => {
  const depuis = Date.parse("2026-11-06T20:00:00Z");
  const run = (conclusion: string | null) => ({ status: "completed", conclusion, created_at: "2026-11-06T20:00:05Z", updated_at: "2026-11-06T20:12:05Z" });
  it("signale un passage terminé sans réussir, pas un passage réussi", () => {
    expect(estimer([run("timed_out")], depuis).echoue).toBe(true);
    expect(estimer([run("cancelled")], depuis).echoue).toBe(true);
    expect(estimer([run("success")], depuis).echoue).toBeUndefined();
  });
});
