/**
 * Étape 3 — Optimisation des balises.
 * Pour chaque page du rapport dont le CTR est trop bas pour sa position, demande au
 * modèle un nouveau titre et une nouvelle description alignés sur les requêtes réelles,
 * et les écrit dans seo/meta-overrides.json (lu par src/lib/seo.ts au build).
 * Une surcharge n'est remplacée qu'après 6 semaines d'observation, pour laisser
 * Google réagir (variante « A puis B », pas de test simultané).
 */
import Anthropic from "@anthropic-ai/sdk";
import { readJson, writeJson, FACTS } from "./lib.mjs";

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("ANTHROPIC_API_KEY manquante : pas d'optimisation des balises.");
  process.exit(0);
}
const MODEL = process.env.SEO_MODEL ?? "claude-sonnet-4-5";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const report = readJson("seo/report.json", { metaFixes: [] });
const overrides = readJson("seo/meta-overrides.json", {});
const now = Date.now();
const SIX_WEEKS = 42 * 86400_000;
let changed = 0;

for (const fix of report.metaFixes ?? []) {
  const current = overrides[fix.path];
  if (current?.since && now - new Date(current.since).getTime() < SIX_WEEKS) {
    console.log(`${fix.path} : surcharge récente (${current.since}), on laisse Google réagir.`);
    continue;
  }
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: `Tu écris des balises <title> et meta description pour un site français de permis de construire de maison individuelle (maître d'œuvre, formules à prix fixe jusqu'à 149 m², partout en France). Faits à respecter :\n${FACTS}\nRéponds uniquement en JSON : {"title": "...", "description": "...", "reason": "..."}. Title 50-60 caractères, description 140-155 caractères, en français, sans majuscules abusives, sans point d'exclamation, sans promesse invérifiable.`,
    messages: [
      {
        role: "user",
        content: `Page : ${fix.path}\nPosition moyenne : ${fix.position}\nCTR : ${(fix.ctr * 100).toFixed(1)} % (attendu ~${(fix.expectedCtr * 100).toFixed(0)} %)\nRequêtes qui affichent cette page : ${fix.topQueries.join(" ; ")}\n${current ? `Balises actuelles (à améliorer, pas à copier) : ${JSON.stringify({ title: current.title, description: current.description })}` : ""}\nPropose un titre et une description qui répondent exactement à l'intention de ces requêtes.`,
      },
    ],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  try {
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    if (json.title && json.description) {
      overrides[fix.path] = { ...json, since: new Date().toISOString().slice(0, 10), previous: current ? { title: current.title, description: current.description } : undefined };
      changed++;
      console.log(`${fix.path} → « ${json.title} »`);
    }
  } catch {
    console.warn(`${fix.path} : réponse illisible, ignorée.`);
  }
}
writeJson("seo/meta-overrides.json", overrides);
console.log(`${changed} balise(s) mise(s) à jour.`);
