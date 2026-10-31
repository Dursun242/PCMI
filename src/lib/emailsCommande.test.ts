import { describe, expect, it } from "vitest";
import { validerCommande } from "./commande";
import { emailConfirmationClient, emailLienSignature, emailNouvelleCommande } from "./emailsCommande";

const r = validerCommande({
  panier: { formule: "complet", options: {} },
  echeances: 4,
  coordonnees: {
    prenom: "Marie",
    nom: "Martin",
    email: "marie@example.fr",
    telephone: "0612345678",
    adresse: "12 rue des Lilas",
    codePostal: "76600",
    ville: "Le Havre",
    terrainAdresse: "Chemin <du> Bois",
    terrainCodePostal: "76290",
    terrainCommune: "Montivilliers",
    surface: "120",
  },
});
if (!r.ok) throw new Error(r.erreur);
const commande = r.commande;
const devis = { numero: "D-2026-012", url: "https://portal.qonto.com/quotes/1" };

describe("e-mails de la commande", () => {
  it("le lien de signature mène à la page de signature", () => {
    const e = emailLienSignature("Marie", "https://site.test/commander/signer?jeton=abc");
    expect(e.html).toContain('href="https://site.test/commander/signer?jeton=abc"');
    expect(e.subject).toMatch(/Confirmez votre commande/);
  });

  it("la confirmation donne le devis, les CGV et le délai de rétractation, en échappant le texte saisi", () => {
    const e = emailConfirmationClient(commande, devis);
    expect(e.html).toContain(devis.url);
    expect(e.html).toContain("/cgv");
    expect(e.html).toMatch(/14 jours/);
    expect(e.html).toContain("Chemin &lt;du&gt; Bois");
    expect(e.html).not.toContain("Chemin <du> Bois");
  });

  it("la fiche interne contient la facturation à lancer et la preuve de signature", () => {
    const e = emailNouvelleCommande(
      commande,
      devis,
      { iban: "•••• 0189", reference: "RUM-1" },
      { instant: "2026-11-01T10:00:00Z", ip: "1.2.3.4", navigateur: "Safari", executionAnticipee: false },
      "2026-11-01",
    );
    expect(e.subject).toMatch(/Commande signée — Marie Martin — Montivilliers/);
    expect(e.html).toMatch(/Récurrente, mensuelle, 4 factures/);
    expect(e.html).toMatch(/16\/11\/2026/);
    expect(e.html).toContain("RUM-1");
    expect(e.html).toContain("1.2.3.4");
  });
});
