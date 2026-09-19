#!/usr/bin/env node
/**
 * Vérifie, sur le site RÉELLEMENT RENDU, que chaque page porte les données
 * structurées attendues, un canonical et un titre.
 *
 * On lit le HTML servi plutôt que le code source : c'est la seule façon de
 * détecter qu'un composant a cessé d'être rendu, qu'un <script> a été avalé
 * par un Suspense, ou qu'un JSON-LD est devenu illisible.
 *
 * Usage :
 *   npm run check:seo                  # démarre `next start` puis vérifie
 *   npm run check:seo -- --url=https://permis-maison-individuelle.fr
 */
import { spawn } from "node:child_process";
import process from "node:process";

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=");

const EXTERNAL = arg("url");
const PORT = Number(arg("port") ?? 3210);
const BASE = EXTERNAL ?? `http://127.0.0.1:${PORT}`;

/** Ce que chaque page doit porter. */
const EXPECTATIONS = [
  { path: "/", types: ["ProfessionalService", "WebSite", "FAQPage"] },
  { path: "/tarifs", types: ["ProfessionalService", "WebSite", "Service", "BreadcrumbList"] },
  { path: "/permis-de-construire-maison", types: ["Article", "FAQPage", "BreadcrumbList"] },
  { path: "/conseils", types: ["CollectionPage", "BreadcrumbList"] },
  { path: "/a-propos", types: ["AboutPage", "BreadcrumbList"] },
  { path: "/contact", types: ["ContactPage", "BreadcrumbList"] },
  { path: "/devis", types: ["ContactPage", "BreadcrumbList"] },
  { path: "/dossier", types: ["ContactPage", "BreadcrumbList"] },
  { path: "/mentions-legales", types: [] },
  { path: "/cgv", types: [] },
];

/** Vérifications supplémentaires sur le contenu des schémas. */
const ASSERTIONS = [
  {
    path: "/tarifs",
    label: "les trois formules sont en Offer avec un prix TTC",
    check: (nodes) => {
      const service = nodes.find((n) => n["@type"] === "Service");
      const offers = service?.offers ?? [];
      return (
        offers.length === 3 &&
        offers.every(
          (o) =>
            typeof o.price === "number" &&
            o.priceCurrency === "EUR" &&
            o.priceSpecification?.valueAddedTaxIncluded === true,
        )
      );
    },
  },
  {
    path: "/",
    label: "la FAQPage reprend au moins 6 questions",
    check: (nodes) => (nodes.find((n) => n["@type"] === "FAQPage")?.mainEntity ?? []).length >= 6,
  },
  {
    path: "/permis-de-construire-maison",
    label: "l'Article porte datePublished et dateModified",
    check: (nodes) => {
      const a = nodes.find((n) => n["@type"] === "Article");
      return Boolean(a?.datePublished && a?.dateModified);
    },
  },
];

const ARTICLE_TYPES = ["BlogPosting", "BreadcrumbList"];

function extractJsonLd(html) {
  const nodes = [];
  const errors = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].replace(/\\u003c/g, "<");
    try {
      const parsed = JSON.parse(raw);
      nodes.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch (e) {
      errors.push(`JSON-LD illisible : ${e.message}`);
    }
  }
  return { nodes, errors };
}

async function fetchPage(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": "check-seo" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) return;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Le serveur n'a pas répondu sur ${BASE}`);
}

async function discoverArticles() {
  const xml = await fetchPage("/sitemap.xml");
  return [...xml.matchAll(/<loc>([^<]*\/conseils\/[^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

async function run() {
  const failures = [];
  const checked = [];

  const cases = [...EXPECTATIONS];
  for (const path of await discoverArticles()) cases.push({ path, types: ARTICLE_TYPES });

  for (const { path, types } of cases) {
    let html;
    try {
      html = await fetchPage(path);
    } catch (e) {
      failures.push(`${path} — page inaccessible (${e.message})`);
      continue;
    }

    const { nodes, errors } = extractJsonLd(html);
    for (const e of errors) failures.push(`${path} — ${e}`);

    const present = nodes.map((n) => n["@type"]);
    for (const t of types) {
      if (!present.includes(t)) failures.push(`${path} — schéma ${t} absent (présents : ${present.join(", ") || "aucun"})`);
    }

    if (!/<title>/.test(html)) failures.push(`${path} — <title> absent`);
    if (!/rel="canonical"/.test(html) && !path.startsWith("/mentions") && path !== "/cgv") {
      failures.push(`${path} — canonical absent`);
    }

    for (const a of ASSERTIONS.filter((x) => x.path === path)) {
      if (!a.check(nodes)) failures.push(`${path} — ${a.label} : non vérifié`);
    }

    checked.push(`${path} (${present.length} schéma${present.length > 1 ? "s" : ""})`);
  }

  // llms.txt doit exister et rester synchronisé avec les prix affichés.
  try {
    const llms = await fetchPage("/llms.txt");
    if (!/## Formules/.test(llms)) failures.push("/llms.txt — section « Formules » absente");
    const tarifs = await fetchPage("/tarifs");
    for (const prix of ["1 490", "1 990", "2 990"]) {
      const dansLlms = llms.includes(prix);
      const dansTarifs = tarifs.includes(prix) || tarifs.includes(prix.replace(" ", " "));
      if (dansTarifs && !dansLlms) failures.push(`/llms.txt — le prix ${prix} € affiché sur /tarifs est absent`);
    }
    checked.push("/llms.txt");
  } catch (e) {
    failures.push(`/llms.txt — inaccessible (${e.message})`);
  }

  console.log(`\nPages vérifiées (${checked.length}) :`);
  for (const c of checked) console.log(`  ✓ ${c}`);

  if (failures.length) {
    console.error(`\n${failures.length} problème(s) :`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    return 1;
  }
  console.log("\nTout est en place.\n");
  return 0;
}

let server;
try {
  if (!EXTERNAL) {
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
    await waitForServer();
  }
  process.exitCode = await run();
} catch (e) {
  console.error(`\n✗ ${e.message}\n`);
  process.exitCode = 1;
} finally {
  if (server?.pid) {
    try {
      process.kill(-server.pid);
    } catch {
      /* déjà arrêté */
    }
  }
}
