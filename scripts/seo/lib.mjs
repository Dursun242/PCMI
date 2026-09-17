/**
 * Fonctions partagées du moteur SEO.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { GoogleAuth } from "google-auth-library";

export const ROOT = resolve(import.meta.dirname, "../..");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://permis.id-maitrise.com").replace(/\/$/, "");
export const GSC_PROPERTY = process.env.GSC_PROPERTY ?? `sc-domain:${new URL(SITE_URL).hostname.replace(/^permis\./, "")}`;

export const readJson = (rel, fallback) => {
  const f = resolve(ROOT, rel);
  if (!existsSync(f)) return fallback;
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return fallback;
  }
};
export const writeJson = (rel, data) => writeFileSync(resolve(ROOT, rel), JSON.stringify(data, null, 2) + "\n");

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Articles existants (frontmatter uniquement). */
export function listArticles() {
  const dir = resolve(ROOT, "content/articles");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const { data, content } = matter(readFileSync(resolve(dir, f), "utf8"));
      return {
        slug: f.replace(/\.mdx?$/, ""),
        path: `/conseils/${f.replace(/\.mdx?$/, "")}`,
        title: data.title ?? "",
        description: data.description ?? "",
        keywords: data.keywords ?? [],
        date: data.date ?? "",
        words: content.split(/\s+/).length,
      };
    });
}

/** Pages statiques du site, avec leurs mots-clés cibles (pour la détection de couverture). */
export const STATIC_PAGES = [
  { path: "/", keywords: ["permis de construire maison", "maître d'œuvre permis", "permis de construire prix fixe"] },
  { path: "/tarifs", keywords: ["prix permis de construire", "tarif permis de construire maison", "coût dossier permis"] },
  {
    path: "/permis-de-construire-maison",
    keywords: ["permis de construire maison individuelle", "pièces PCMI", "délai instruction permis", "150 m2 architecte", "affichage permis", "RE2020 permis"],
  },
  { path: "/devis", keywords: ["devis permis de construire"] },
];

/** Search Console : requêtes des 28 derniers jours (ou null si non configuré). */
export async function fetchSearchConsole({ days = 28, dimensions = ["query", "page"], rowLimit = 5000 } = {}) {
  const creds = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!creds) return null;
  const auth = new GoogleAuth({
    credentials: JSON.parse(creds),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const end = new Date();
  end.setDate(end.getDate() - 2); // GSC a ~2 jours de latence
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_PROPERTY)}/searchAnalytics/query`;
  const res = await client.request({
    url,
    method: "POST",
    data: { startDate: fmt(start), endDate: fmt(end), dimensions, rowLimit, dataState: "final" },
  });
  return (res.data.rows ?? []).map((r) => ({
    query: r.keys[0],
    page: r.keys[1] ?? null,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

/** Mots significatifs d'une requête (pour mesurer la couverture). */
const STOP = new Set("de du des la le les un une et ou pour a à en dans sur au aux d l qui que quoi comment combien est ce cette son sa ses mon ma mes votre vos par avec sans".split(" "));
export const tokens = (s) =>
  slugify(s)
    .split("-")
    .filter((t) => t.length > 2 && !STOP.has(t));

/** Score de recouvrement lexical entre une requête et un article (0..1). */
export function coverage(query, article) {
  const q = new Set(tokens(query));
  const bag = new Set([...tokens(article.title), ...article.keywords.flatMap(tokens), ...tokens(article.description ?? "")]);
  let hit = 0;
  for (const t of q) if (bag.has(t)) hit++;
  return q.size ? hit / q.size : 0;
}

/** Faits réglementaires que le rédacteur ne doit pas contredire. */
export const FACTS = `
- Permis de construire de maison individuelle : formulaire CERFA n° 13406 ; pièces obligatoires PCMI 1 à PCMI 8 (plan de situation, plan de masse, coupe, notice, façades et toitures, insertion graphique, photo proche, photo lointaine).
- Délai d'instruction : 2 mois pour une maison individuelle ; 3 mois si avis de l'Architecte des Bâtiments de France (abords de monument historique, site patrimonial). La mairie peut demander des pièces manquantes dans le mois suivant le dépôt ; le demandeur a 3 mois pour les fournir.
- Architecte obligatoire pour un particulier quand la surface de plancher dépasse 150 m². Les formules à prix fixe de Permis by ID Maîtrise couvrent les maisons jusqu'à 149 m² ; au-delà, devis uniquement avec architecte partenaire.
- Déclaration préalable : constructions de 5 à 20 m² d'emprise au sol ou de surface de plancher ; extensions jusqu'à 20 m² (40 m² en zone urbaine d'un PLU si la surface totale reste sous 150 m²).
- Affichage du panneau sur le terrain pendant toute la durée des travaux ; recours des tiers : 2 mois à compter du premier jour d'affichage continu ; retrait par l'administration possible dans les 3 mois.
- Validité du permis : 3 ans, prorogeable deux fois un an, demande au moins 2 mois avant l'échéance.
- RE2020 : attestation de prise en compte obligatoire au dépôt pour les maisons neuves (permis déposés depuis le 1er janvier 2022) ; seconde attestation à l'achèvement.
- Dépôt dématérialisé : toutes les communes doivent recevoir les demandes par voie électronique depuis le 1er janvier 2022 ; les communes de plus de 3 500 habitants disposent d'une téléprocédure.
- Le permis lui-même est gratuit ; la taxe d'aménagement est due après achèvement, calculée sur la surface taxable, taux variable selon la commune.
- Prix des formules (TTC) : Essentiel 1 490 €, Complet 1 990 €, Premium 2 990 €. Ne jamais inventer d'autres chiffres de prix ; s'il faut donner une fourchette de marché, rester prudent et dire « de l'ordre de ».
`;
