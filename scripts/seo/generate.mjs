/**
 * Étape 2 — Rédaction.
 * Prend la meilleure opportunité du rapport (ou --query "…") et écrit un article MDX
 * dans content/articles/, avec l'API Anthropic. Option --refresh <slug> pour
 * réécrire/étoffer un article existant en perte de position.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { readJson, writeJson, slugify, listArticles, FACTS, ROOT } from "./lib.mjs";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const MODEL = process.env.SEO_MODEL ?? "claude-sonnet-4-5";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY manquante : aucun article généré.");
  process.exit(0);
}

const report = readJson("seo/report.json", { opportunities: [] });
const existing = listArticles();
const internalLinks = [
  "/tarifs (les trois formules à prix fixe)",
  "/devis (demander un devis sous 48 h)",
  "/permis-de-construire-maison (le guide complet du permis)",
  ...existing.map((a) => `${a.path} (${a.title})`),
].join("\n");

const SYSTEM = `Tu es Dursun Ozkan, maître d'œuvre à Le Havre, fondateur d'ID Maîtrise, qui dépose des permis de construire de maisons individuelles toute l'année, partout en France. Tu écris pour le site « Permis by ID Maîtrise », en français, pour des particuliers qui font construire.

Style : précis, concret, sans jargon inutile, sans emphase commerciale. Phrases courtes. Tu donnes des exemples tirés du terrain (mairie, instructeur, PLU, voisins). Tu ne flattes pas le lecteur, tu l'aides à décider.

Règles absolues :
- Ne contredis jamais les faits suivants et n'invente aucun chiffre réglementaire ou tarifaire au-delà :
${FACTS}
- Pas de titre H1 dans le corps (le titre est dans le frontmatter). Utilise des H2 (##) et au besoin des H3 (###).
- 900 à 1 400 mots. Une liste à puces maximum toutes les deux sections.
- Termine par un court paragraphe qui renvoie naturellement vers /tarifs ou /devis (liens Markdown relatifs), sans formule racoleuse.
- Ajoute 1 ou 2 liens internes pertinents parmi :
${internalLinks}
- Ne cite aucun concurrent, aucune marque de constructeur, aucune source externe avec URL.
- Réponds UNIQUEMENT avec le fichier MDX complet : frontmatter YAML (title, description, date, keywords) puis le corps. Le title fait 50 à 65 caractères et contient la requête cible ou une variante naturelle ; la description fait 140 à 160 caractères.`;

async function write(query, extra = "") {
  const today = new Date().toISOString().slice(0, 10);
  const user = `Requête cible : « ${query} ».
Date de publication : ${today}.
${extra}
Rédige l'article.`;
  const res = await client.messages.create({ model: MODEL, max_tokens: 4000, system: SYSTEM, messages: [{ role: "user", content: user }] });
  let text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("").trim();
  text = text.replace(/^```(?:mdx|markdown|md)?\s*/i, "").replace(/```\s*$/, "");
  const parsed = matter(text);
  if (!parsed.data.title || !parsed.data.description) throw new Error("Frontmatter incomplet dans la réponse du modèle.");
  parsed.data.date = parsed.data.date ? String(parsed.data.date).slice(0, 10) : today;
  if (!Array.isArray(parsed.data.keywords)) parsed.data.keywords = [query];
  if (!parsed.data.keywords.includes(query)) parsed.data.keywords.unshift(query);
  return parsed;
}

const refreshSlug = arg("--refresh");
if (refreshSlug) {
  const file = resolve(ROOT, `content/articles/${refreshSlug}.mdx`);
  if (!existsSync(file)) throw new Error(`Article introuvable : ${refreshSlug}`);
  const current = matter(readFileSync(file, "utf8"));
  const parsed = await write(current.data.keywords?.[0] ?? current.data.title, `Voici l'article actuel, à réécrire en l'étoffant (nouvelles sections utiles, exemples concrets, FAQ de 3 questions en fin d'article), en conservant le même angle et le même titre si possible :\n\n${current.content}`);
  parsed.data.date = current.data.date;
  parsed.data.updated = new Date().toISOString().slice(0, 10);
  writeFileSync(file, matter.stringify(parsed.content, parsed.data));
  console.log(`Article rafraîchi : ${refreshSlug}`);
  process.exit(0);
}

const query = arg("--query") ?? report.opportunities?.[0]?.query;
if (!query) {
  console.log("Aucune opportunité à écrire.");
  process.exit(0);
}
console.log(`Sujet retenu : « ${query} »`);
const parsed = await write(query);
let slug = slugify(parsed.data.title);
if (existing.some((a) => a.slug === slug)) slug += "-" + parsed.data.date.replace(/-/g, "").slice(2);
writeFileSync(resolve(ROOT, `content/articles/${slug}.mdx`), matter.stringify(parsed.content, parsed.data));

const done = readJson("seo/topics-done.json", []);
done.push({ query, slug, date: parsed.data.date, source: report.opportunities?.[0]?.source ?? "manual" });
writeJson("seo/topics-done.json", done);
console.log(`Article écrit : content/articles/${slug}.mdx`);
