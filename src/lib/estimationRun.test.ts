import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { DUREE_DEFAUT_S, estimer } from "./plancheGithub";

const T0 = Date.parse("2026-11-06T10:00:00Z");
const iso = (s: number) => new Date(T0 + s * 1000).toISOString();
const fini = (debut: number, duree: number) => ({ status: "completed", conclusion: "success", created_at: iso(debut), updated_at: iso(debut + duree) });

describe("compte à rebours : estimation du temps restant", () => {
  const passes = [fini(-3600, 170), fini(-2400, 200), fini(-1200, 185)];

  test("durée habituelle = médiane des derniers passages réussis", () => {
    expect(estimer(passes, T0, T0).habituel).toBe(185);
    expect(estimer([], T0, T0).habituel).toBe(DUREE_DEFAUT_S);
  });

  test("dossier en file d'attente : toute la durée habituelle", () => {
    const r = estimer([...passes, { status: "queued", conclusion: null, created_at: iso(2), updated_at: iso(2) }], T0, T0 + 60_000);
    expect(r).toMatchObject({ etat: "attente", restant: 185 });
  });

  test("dessin commencé depuis 2 min : il reste la durée habituelle moins 2 min", () => {
    const r = estimer([...passes, { status: "in_progress", conclusion: null, created_at: iso(3), updated_at: iso(60) }], T0, T0 + 123_000);
    expect(r).toMatchObject({ etat: "dessin", restant: 65 });
  });

  test("passage fini : quelques secondes pour l'envoi au site", () => {
    expect(estimer([...passes, fini(3, 190)], T0, T0 + 200_000)).toMatchObject({ etat: "termine", restant: 20 });
  });

  test("les passages d'avant le dossier ne sont pas le sien", () => {
    expect(estimer(passes, T0, T0 + 30_000).etat).toBe("inconnu");
  });
});
