import { describe, expect, it } from "vitest";
import { validerCommande, type Commande } from "./commande";
import {
  configQonto,
  corpsClient,
  corpsDevis,
  corpsMandat,
  creerCommandeQonto,
  ErreurQonto,
  lireDevis,
  lireMandat,
  masquerIban,
  type ConfigQonto,
} from "./qonto";

const coordonnees = {
  prenom: "Marie",
  nom: "Martin",
  email: "marie@example.fr",
  telephone: "06 12 34 56 78",
  adresse: "12 rue des Lilas",
  codePostal: "76600",
  ville: "Le Havre",
  terrainAdresse: "Chemin du Bois",
  terrainCodePostal: "76290",
  terrainCommune: "Montivilliers",
  surface: "120",
  referenceCadastrale: "AB 123",
};

function commande(options: Record<string, number> = {}, echeances = 4): Commande {
  const r = validerCommande({ panier: { formule: "complet", options }, coordonnees, echeances });
  if (!r.ok) throw new Error(r.erreur);
  return r.commande;
}

const CONFIG: ConfigQonto = { base: "https://qonto.test", headers: { Authorization: "login:cle" } };

describe("configQonto", () => {
  it("appelle la vraie banque avec le jeton d'accès OAuth", () => {
    const c = configQonto("jeton-oauth", {});
    expect(c.base).toBe("https://thirdparty.qonto.com");
    expect(c.headers).toEqual({ Authorization: "Bearer jeton-oauth" });
  });

  it("appelle la banque de test avec le jeton de test", () => {
    const c = configQonto("jeton-oauth", { QONTO_STAGING_TOKEN: "t" });
    expect(c.base).toBe("https://thirdparty-sandbox.staging.qonto.co");
    expect(c.headers["X-Qonto-Staging-Token"]).toBe("t");
  });
});

describe("corpsClient", () => {
  it("crée un particulier facturable, téléphone au format international", () => {
    const corps = corpsClient(commande().coordonnees);
    expect(corps).toMatchObject({
      kind: "individual",
      first_name: "Marie",
      last_name: "Martin",
      email: "marie@example.fr",
      currency: "EUR",
      locale: "fr",
      phone: { country_code: "+33", number: "612345678" },
      billing_address: { street_address: "12 rue des Lilas", city: "Le Havre", zip_code: "76600", country_code: "FR" },
    });
  });

  it("omet un téléphone qui n'est pas un numéro français", () => {
    const c = { ...commande().coordonnees, telephone: "+44 20 7946 0958" };
    expect(corpsClient(c).phone).toBeUndefined();
  });
});

describe("corpsDevis", () => {
  it("reprend chaque ligne en une quantité, au HT qui redonne le TTC exact", () => {
    const corps = corpsDevis("client-1", commande({ "rendu-3d": 2 }), "2026-11-01");
    expect(corps.items).toHaveLength(2);
    for (const item of corps.items) {
      expect(item.quantity).toBe("1");
      expect(item.vat_rate).toBe("0.2");
    }
    const rendus = corps.items[1];
    expect(rendus.title).toBe("2 × Rendu 3D supplémentaire");
    expect(Math.round(Number(rendus.unit_price.value) * 1.2 * 100) / 100).toBe(460);
  });

  it("date le devis et le fait expirer avec le lien de signature", () => {
    const corps = corpsDevis("client-1", commande(), "2026-11-01");
    expect(corps).toMatchObject({ client_id: "client-1", issue_date: "2026-11-01", expiry_date: "2026-11-08", currency: "EUR" });
  });

  it("nomme la prestation « Permis de construire » et détaille le terrain sur sa ligne", () => {
    const corps = corpsDevis("client-1", commande({ "rendu-3d": 1 }), "2026-11-01");
    const [permis, option] = corps.items;
    expect(permis.title).toBe("Permis de construire Complet");
    expect(permis.description).toMatch(/Chemin du Bois, 76290 Montivilliers/);
    expect(permis.description).toMatch(/AB 123/);
    expect(permis.description).toMatch(/120 m²/);
    expect(option.title).toBe("Rendu 3D supplémentaire");
    expect(option.description).toBeUndefined();
    expect(corps).not.toHaveProperty("header");
  });

  it("indique la facturation et les CGV", () => {
    const corps = corpsDevis("client-1", commande(), "2026-11-01");
    expect(corps.footer).toMatch(/une facture de .+, réglée en 4 prélèvements SEPA mensuels/);
    expect(corps.terms_and_conditions).toMatch(/\/cgv/);
    expect(corps.terms_and_conditions.length).toBeLessThanOrEqual(3000);
  });
});

describe("corpsMandat", () => {
  it("demande un mandat sans e-mail de Qonto : le site guide lui-même le client", () => {
    expect(corpsMandat("client-1")).toEqual({ direct_debit_mandate: { client_id: "client-1", send_mandate_signature_email: false } });
  });
});

describe("masquerIban", () => {
  it("ne garde que les quatre derniers caractères", () => {
    expect(masquerIban("FR7630006000011234567890189")).toBe("•••• 0189");
    expect(masquerIban(undefined)).toBe("");
  });
});

type Appel = { url: string; method: string; body: unknown };

function fauxFetch(reponses: Record<string, unknown>, appels: Appel[]): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    appels.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const cle = `${method} ${url.replace(CONFIG.base, "")}`;
    if (!(cle in reponses)) return new Response("introuvable", { status: 404 });
    return new Response(JSON.stringify(reponses[cle]), { status: 200 });
  }) as typeof fetch;
}

describe("creerCommandeQonto", () => {
  const LISTE = "GET /v2/clients?filter%5Bemail%5D=marie%40example.fr";
  const reponsesCreation = {
    "POST /v2/clients": { client: { id: "client-1" } },
    "POST /v2/quotes": { quote: { id: "devis-1", number: "D-2026-012" } },
    "POST /v2/sepa/direct_debit_mandates": { direct_debit_mandate: { id: "mandat-1", sign_url: "https://pay.qonto.com/mandates/1" } },
  };
  const trace = (appels: Appel[]) => appels.map((a) => `${a.method} ${a.url.replace(CONFIG.base, "")}`);

  it("crée le client, le mandat puis le devis et renvoie la page de saisie de l'IBAN", async () => {
    const appels: Appel[] = [];
    const f = fauxFetch({ [LISTE]: { clients: [] }, ...reponsesCreation }, appels);
    const r = await creerCommandeQonto(CONFIG, commande(), "2026-11-01", f);
    expect(r).toEqual({ clientId: "client-1", devisId: "devis-1", mandatId: "mandat-1", urlMandat: "https://pay.qonto.com/mandates/1" });
    expect(trace(appels)).toEqual([LISTE, "POST /v2/clients", "POST /v2/sepa/direct_debit_mandates", "POST /v2/quotes"]);
    expect((appels[3].body as { client_id: string }).client_id).toBe("client-1");
  });

  it("reprend le client qui existe déjà pour cet e-mail", async () => {
    const appels: Appel[] = [];
    const f = fauxFetch({ [LISTE]: { clients: [{ id: "client-existant", email: "Marie@Example.fr" }] }, ...reponsesCreation }, appels);
    const r = await creerCommandeQonto(CONFIG, commande(), "2026-11-01", f);
    expect(r.clientId).toBe("client-existant");
    expect(trace(appels)).not.toContain("POST /v2/clients");
  });

  it("ne crée pas de devis si le mandat est refusé", async () => {
    const appels: Appel[] = [];
    const f = fauxFetch({ [LISTE]: { clients: [] }, "POST /v2/clients": { client: { id: "client-1" } } }, appels);
    await expect(creerCommandeQonto(CONFIG, commande(), "2026-11-01", f)).rejects.toThrow(ErreurQonto);
    expect(trace(appels)).not.toContain("POST /v2/quotes");
  });
});

describe("lireMandat", () => {
  it("dit si le mandat est signé et masque l'IBAN", async () => {
    const f = fauxFetch(
      {
        "GET /v2/sepa/direct_debit_mandates/mandat-1": {
          direct_debit_mandate: { id: "mandat-1", status: "approved", iban: "FR7630006000011234567890189", unique_mandate_reference: "RUM-1" },
        },
      },
      [],
    );
    expect(await lireMandat(CONFIG, "mandat-1", f)).toEqual({ signe: true, iban: "•••• 0189", reference: "RUM-1", urlSignature: undefined });
  });
});

describe("lireDevis", () => {
  it("restitue le devis tel que Qonto l'a établi : dates, lignes, totaux, émetteur et client", async () => {
    const quote = {
      number: "D-2026-058",
      quote_url: "https://portal.qonto.com/quotes/1",
      issue_date: "2026-10-31",
      expiry_date: "2026-11-07",
      footer: "Prix facturé en une facture de 890 € TTC.",
      terms_and_conditions: "Conditions.",
      total_amount: { value: "890.00", currency: "EUR" },
      vat_amount: { value: "148.33", currency: "EUR" },
      items: [
        {
          title: "Permis de construire Express",
          description: "Terrain : 64 rue Henri Dunant",
          quantity: "1",
          unit_price: { value: "741.67" },
          vat_rate: "0.2",
          subtotal: { value: "741.67" },
          total_vat: { value: "148.33" },
          total_amount: { value: "890.00" },
        },
      ],
      client: { name: "Dursun OZKAN", address: "64 RUE HENRI DUNANT", zip_code: "76620", city: "LE HAVRE", email: "d@example.fr" },
      organization: { legal_name: "ID MAITRISE", address_line_1: "9 RUE HENRY GENESTAL", address_zipcode: "76600", address_city: "LE HAVRE", legal_number: "92153618100024" },
    };
    const f = fauxFetch({ "GET /v2/quotes/devis-1": { quote } }, []);
    const d = await lireDevis(CONFIG, "devis-1", f);
    expect(d).toMatchObject({
      numero: "D-2026-058",
      url: "https://portal.qonto.com/quotes/1",
      dateEmission: "2026-10-31",
      dateExpiration: "2026-11-07",
      totalHT: 741.67,
      totalTVA: 148.33,
      totalTTC: 890,
      pied: "Prix facturé en une facture de 890 € TTC.",
      client: { nom: "Dursun OZKAN", adresse: "64 RUE HENRI DUNANT", ville: "76620 LE HAVRE", email: "d@example.fr" },
      emetteur: { nom: "ID MAITRISE", adresse: "9 RUE HENRY GENESTAL", ville: "76600 LE HAVRE", siret: "92153618100024" },
    });
    expect(d.lignes).toEqual([
      { titre: "Permis de construire Express", description: "Terrain : 64 rue Henri Dunant", quantite: 1, prixUnitaireHT: 741.67, tauxTVA: 0.2, totalHT: 741.67 },
    ]);
  });
});
