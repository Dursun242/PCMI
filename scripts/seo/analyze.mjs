/**
 * Étape 1 — Analyse.
 * Lit Search Console (si configuré) et les mots-clés de départ, mesure ce que le site
 * couvre déjà, et produit seo/report.json + seo/report.md :
 *  - opportunities : requêtes à écrire (fort volume, position 5-40, pas d'article dédié)
 *  - metaFixes     : pages bien placées mais peu cliquées (titre/description à retravailler)
 *  - refresh       : articles dont la position se dégrade
 */
import { fetchSearchConsole, listArticles, STATIC_PAGES, coverage, readJson, writeJson, SITE_URL, ROOT } from "./lib.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const articles = listArticles();
const done = new Set(readJson("seo/topics-done.json", []).map((t) => t.query));
const seeds = readJson("seo/seed-keywords.json", { keywords: [] }).keywords;

const allPages = [
  ...STATIC_PAGES.map((p) => ({ ...p, title: p.path, description: "" })),
  ...articles,
];
const isCovered = (query) => allPages.some((p) => coverage(query, { title: p.title ?? "", keywords: p.keywords ?? [], description: p.description ?? "" }) >= 0.6);

let rows = null;
try {
  rows = await fetchSearchConsole();
  console.log(rows ? `Search Console : ${rows.length} lignes` : "Search Console non configurée (GSC_SERVICE_ACCOUNT_JSON absent) : mode mots-clés de départ.");
} catch (e) {
  console.warn("Search Console indisponible :", e.message);
}

// ---- Opportunités de contenu ----
const opportunities = [];
if (rows && rows.length) {
  // agrégation par requête
  const byQuery = new Map();
  for (const r of rows) {
    const q = byQuery.get(r.query) ?? { query: r.query, clicks: 0, impressions: 0, positions: [], pages: new Set() };
    q.clicks += r.clicks;
    q.impressions += r.impressions;
    q.positions.push(r.position * r.impressions);
    if (r.page) q.pages.add(r.page.replace(SITE_URL, ""));
    byQuery.set(r.query, q);
  }
  for (const q of byQuery.values()) {
    const position = q.positions.reduce((a, b) => a + b, 0) / Math.max(1, q.impressions);
    const branded = /id ?ma[iî]trise|permis by/i.test(q.query);
    if (branded || q.impressions < 20) continue;
    // score : impressions pondérées par la marge de progression (positions 5 à 40) et l'absence de page dédiée
    const margin = position < 5 ? 0.2 : position <= 40 ? 1 : 0.4;
    const dedicated = isCovered(q.query) ? 0.35 : 1;
    const score = Math.round(q.impressions * margin * dedicated);
    opportunities.push({ query: q.query, impressions: q.impressions, clicks: q.clicks, position: +position.toFixed(1), pages: [...q.pages], covered: isCovered(q.query), score, source: "gsc" });
  }
}
// mots-clés de départ, toujours en complément (score fixe, plus faible que du trafic réel)
for (const k of seeds) {
  if (done.has(k.query) || opportunities.some((o) => o.query === k.query)) continue;
  opportunities.push({ query: k.query, impressions: 0, clicks: 0, position: null, pages: [], covered: isCovered(k.query), score: k.priority * 10, source: "seed", intent: k.intent });
}
opportunities.sort((a, b) => b.score - a.score);
const toWrite = opportunities.filter((o) => !o.covered && !done.has(o.query));

// ---- Titres / descriptions à retravailler ----
const metaFixes = [];
const refresh = [];
if (rows && rows.length) {
  const byPage = new Map();
  for (const r of rows) {
    if (!r.page) continue;
    const path = r.page.replace(SITE_URL, "") || "/";
    const p = byPage.get(path) ?? { path, clicks: 0, impressions: 0, posW: 0, queries: [] };
    p.clicks += r.clicks;
    p.impressions += r.impressions;
    p.posW += r.position * r.impressions;
    p.queries.push({ query: r.query, impressions: r.impressions, position: r.position });
    byPage.set(path, p);
  }
  const history = readJson("seo/history.json", {});
  const today = new Date().toISOString().slice(0, 10);
  for (const p of byPage.values()) {
    const position = p.posW / Math.max(1, p.impressions);
    const ctr = p.clicks / Math.max(1, p.impressions);
    p.queries.sort((a, b) => b.impressions - a.impressions);
    // CTR attendu approximatif par position (courbe prudente)
    const expected = position <= 1 ? 0.28 : position <= 3 ? 0.15 : position <= 5 ? 0.08 : position <= 10 ? 0.04 : 0.015;
    if (p.impressions >= 100 && ctr < expected * 0.6) {
      metaFixes.push({ path: p.path, impressions: p.impressions, clicks: p.clicks, ctr: +ctr.toFixed(3), expectedCtr: expected, position: +position.toFixed(1), topQueries: p.queries.slice(0, 5).map((q) => q.query) });
    }
    // historique de position par page pour détecter les dégradations
    const h = history[p.path] ?? [];
    h.push({ date: today, position: +position.toFixed(1), clicks: p.clicks, impressions: p.impressions });
    history[p.path] = h.slice(-12);
    if (h.length >= 3 && p.path.startsWith("/conseils/")) {
      const before = h[h.length - 3].position;
      if (position - before >= 3 && p.impressions >= 50) refresh.push({ path: p.path, from: before, to: +position.toFixed(1), topQueries: p.queries.slice(0, 5).map((q) => q.query) });
    }
  }
  writeJson("seo/history.json", history);
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: rows && rows.length ? "search-console" : "seed",
  articles: articles.length,
  opportunities: toWrite.slice(0, 25),
  metaFixes: metaFixes.slice(0, 10),
  refresh: refresh.slice(0, 5),
};
writeJson("seo/report.json", report);

const md = [
  `# Rapport SEO — ${report.generatedAt.slice(0, 10)}`,
  ``,
  `Mode : **${report.mode}** · Articles publiés : **${articles.length}**`,
  ``,
  `## Sujets à écrire (top 10)`,
  ``,
  `| Requête | Source | Impressions | Position | Score |`,
  `|---|---|---:|---:|---:|`,
  ...report.opportunities.slice(0, 10).map((o) => `| ${o.query} | ${o.source} | ${o.impressions} | ${o.position ?? "—"} | ${o.score} |`),
  ``,
  `## Titres / descriptions à retravailler`,
  ``,
  report.metaFixes.length
    ? report.metaFixes.map((m) => `- **${m.path}** — position ${m.position}, CTR ${(m.ctr * 100).toFixed(1)} % (attendu ~${(m.expectedCtr * 100).toFixed(0)} %) · requêtes : ${m.topQueries.join(", ")}`).join("\n")
    : `Rien à signaler.`,
  ``,
  `## Articles en perte de position`,
  ``,
  report.refresh.length ? report.refresh.map((r) => `- **${r.path}** : ${r.from} → ${r.to}`).join("\n") : `Rien à signaler.`,
  ``,
].join("\n");
writeFileSync(resolve(ROOT, "seo/report.md"), md);
console.log(md);
