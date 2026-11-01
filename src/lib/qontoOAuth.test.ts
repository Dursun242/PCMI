import { describe, expect, it } from "vitest";
import {
  chiffrer,
  dechiffrer,
  echangerCode,
  ErreurConnexionQonto,
  jetonAcces,
  stockageAvecCache,
  SCOPES_QONTO,
  urlAutorisation,
  type ConfigOAuth,
  type Jetons,
  type StockageJetons,
} from "./qontoOAuth";

const CFG: ConfigOAuth = {
  clientId: "id-client",
  clientSecret: "secret-client",
  urlAuth: "https://oauth.test/oauth2/auth",
  urlJeton: "https://oauth.test/oauth2/token",
};
const HEURE = 3600 * 1000;
const maintenant = Date.UTC(2026, 10, 1, 10);

function stockageMemoire(initial: Jetons | null = null): StockageJetons & { ecritures: Jetons[] } {
  let courant = initial;
  const ecritures: Jetons[] = [];
  return {
    ecritures,
    lire: async () => courant,
    ecrire: async (j) => {
      courant = j;
      ecritures.push(j);
    },
  };
}

function fauxServeurJetons(reponses: (Response | (() => Response))[], corps: URLSearchParams[] = []): typeof fetch {
  return (async (_url: string, init?: RequestInit) => {
    corps.push(new URLSearchParams(String(init?.body)));
    const r = reponses.shift();
    if (!r) throw new Error("appel inattendu");
    return typeof r === "function" ? r() : r;
  }) as typeof fetch;
}

const reponseJetons = (access: string, refresh: string) =>
  new Response(JSON.stringify({ access_token: access, refresh_token: refresh, expires_in: 3600 }), { status: 200 });

describe("urlAutorisation", () => {
  it("demande les droits nécessaires et l'accès hors ligne, avec le state anti-CSRF", () => {
    const url = new URL(urlAutorisation(CFG, "https://site.test/api/admin/qonto/retour", "etat-123"));
    expect(url.origin + url.pathname).toBe(CFG.urlAuth);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("id-client");
    expect(url.searchParams.get("redirect_uri")).toBe("https://site.test/api/admin/qonto/retour");
    expect(url.searchParams.get("state")).toBe("etat-123");
    expect(url.searchParams.get("scope")).toBe(SCOPES_QONTO.join(" "));
    expect(SCOPES_QONTO).toContain("offline_access");
    expect(SCOPES_QONTO).toContain("sepa_direct_debit.write");
  });
});

describe("echangerCode", () => {
  it("échange le code contre des jetons, identifiants dans le corps du formulaire", async () => {
    const corps: URLSearchParams[] = [];
    const j = await echangerCode(CFG, "code-1", "https://site.test/retour", fauxServeurJetons([reponseJetons("a1", "r1")], corps), maintenant);
    expect(j).toEqual({ acces: "a1", renouvellement: "r1", expireA: maintenant + HEURE });
    expect(Object.fromEntries(corps[0])).toEqual({
      grant_type: "authorization_code",
      code: "code-1",
      redirect_uri: "https://site.test/retour",
      client_id: "id-client",
      client_secret: "secret-client",
    });
  });

  it("refuse une réponse sans jeton de renouvellement", async () => {
    const f = fauxServeurJetons([new Response(JSON.stringify({ access_token: "a", expires_in: 3600 }), { status: 200 })]);
    await expect(echangerCode(CFG, "c", "u", f, maintenant)).rejects.toThrow(ErreurConnexionQonto);
  });
});

describe("jetonAcces", () => {
  it("réutilise le jeton d'accès encore valide, sans appeler Qonto", async () => {
    const s = stockageMemoire({ acces: "a1", renouvellement: "r1", expireA: maintenant + 30 * 60 * 1000 });
    expect(await jetonAcces(CFG, s, fauxServeurJetons([]), maintenant)).toBe("a1");
  });

  it("renouvelle un jeton bientôt expiré et enregistre aussitôt le nouveau jeton de renouvellement", async () => {
    const s = stockageMemoire({ acces: "a1", renouvellement: "r1", expireA: maintenant + 30 * 1000 });
    const corps: URLSearchParams[] = [];
    expect(await jetonAcces(CFG, s, fauxServeurJetons([reponseJetons("a2", "r2")], corps), maintenant)).toBe("a2");
    expect(corps[0].get("grant_type")).toBe("refresh_token");
    expect(corps[0].get("refresh_token")).toBe("r1");
    expect(s.ecritures).toEqual([{ acces: "a2", renouvellement: "r2", expireA: maintenant + HEURE }]);
  });

  it("reprend le jeton qu'un autre renouvellement simultané vient d'enregistrer", async () => {
    let courant: Jetons | null = { acces: "a1", renouvellement: "r1", expireA: maintenant - 1 };
    const s: StockageJetons = { lire: async () => courant, ecrire: async (j) => void (courant = j) };
    const refus = () => {
      // Pendant ce temps, une autre instance a renouvelé et enregistré r2.
      courant = { acces: "a2", renouvellement: "r2", expireA: maintenant + HEURE };
      return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
    };
    expect(await jetonAcces(CFG, s, fauxServeurJetons([refus]), maintenant)).toBe("a2");
  });

  it("signale une connexion absente ou expirée", async () => {
    await expect(jetonAcces(CFG, stockageMemoire(null), fauxServeurJetons([]), maintenant)).rejects.toThrow(ErreurConnexionQonto);
    const s = stockageMemoire({ acces: "a1", renouvellement: "r1", expireA: maintenant - 1 });
    const refus = new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
    await expect(jetonAcces(CFG, s, fauxServeurJetons([refus]), maintenant)).rejects.toThrow(ErreurConnexionQonto);
  });
});

describe("stockageAvecCache", () => {
  const CINQ_MIN = 5 * 60 * 1000;

  function sourceComptee(initial: Jetons | null) {
    let courant = initial;
    const compte = { lectures: 0 };
    const source: StockageJetons = {
      lire: async () => {
        compte.lectures++;
        return courant;
      },
      ecrire: async (j) => void (courant = j),
    };
    return { source, compte, remplacer: (j: Jetons) => void (courant = j) };
  }

  it("lit le stockage une seule fois pendant que le tunnel interroge le statut toutes les 4 s", async () => {
    const { source, compte } = sourceComptee({ acces: "a1", renouvellement: "r1", expireA: maintenant + HEURE });
    let t = maintenant;
    const s = stockageAvecCache(source, CINQ_MIN, () => t);
    for (let i = 0; i < 60; i++, t += 4000) expect(await jetonAcces(CFG, s, fauxServeurJetons([]), t)).toBe("a1");
    expect(compte.lectures).toBe(1);
  });

  it("relit le stockage après la durée de mémoire", async () => {
    const { source, compte, remplacer } = sourceComptee({ acces: "a1", renouvellement: "r1", expireA: maintenant + HEURE });
    let t = maintenant;
    const s = stockageAvecCache(source, CINQ_MIN, () => t);
    await s.lire();
    remplacer({ acces: "a2", renouvellement: "r2", expireA: maintenant + 2 * HEURE });
    t += CINQ_MIN;
    expect((await s.lire())?.acces).toBe("a2");
    expect(compte.lectures).toBe(2);
  });

  it("ne sert jamais depuis la mémoire un jeton proche de l'expiration", async () => {
    const { source, compte } = sourceComptee({ acces: "a1", renouvellement: "r1", expireA: maintenant + 3 * 60 * 1000 });
    let t = maintenant;
    const s = stockageAvecCache(source, CINQ_MIN, () => t);
    await s.lire();
    t += 90 * 1000; // il reste 90 s : sous la marge de 2 min
    await s.lire();
    expect(compte.lectures).toBe(2);
  });

  it("garde la reprise du jeton enregistré par une autre instance après un renouvellement refusé", async () => {
    const { source, remplacer } = sourceComptee({ acces: "a1", renouvellement: "r1", expireA: maintenant - 1 });
    const s = stockageAvecCache(source, CINQ_MIN, () => maintenant);
    const refus = () => {
      remplacer({ acces: "a2", renouvellement: "r2", expireA: maintenant + HEURE });
      return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
    };
    expect(await jetonAcces(CFG, s, fauxServeurJetons([refus]), maintenant)).toBe("a2");
  });

  it("sert les jetons qu'elle vient d'écrire sans relire le stockage", async () => {
    const { source, compte } = sourceComptee(null);
    const s = stockageAvecCache(source, CINQ_MIN, () => maintenant);
    await s.ecrire({ acces: "a3", renouvellement: "r3", expireA: maintenant + HEURE });
    expect((await s.lire())?.acces).toBe("a3");
    expect(compte.lectures).toBe(0);
  });

  it("ne garde pas en mémoire une connexion absente", async () => {
    const { source, compte, remplacer } = sourceComptee(null);
    const s = stockageAvecCache(source, CINQ_MIN, () => maintenant);
    expect(await s.lire()).toBeNull();
    remplacer({ acces: "a1", renouvellement: "r1", expireA: maintenant + HEURE });
    expect((await s.lire())?.acces).toBe("a1");
    expect(compte.lectures).toBe(2);
  });
});

describe("chiffrement des jetons", () => {
  it("restitue le texte avec la bonne clé seulement", () => {
    const boite = chiffrer("jetons secrets", "cle-1");
    expect(boite).not.toContain("jetons");
    expect(dechiffrer(boite, "cle-1")).toBe("jetons secrets");
    expect(dechiffrer(boite, "cle-2")).toBeNull();
    expect(dechiffrer("illisible", "cle-1")).toBeNull();
  });
});
