/**
 * Étape 2 bis — Illustration.
 * Dessine l'image de couverture de l'article écrit par generate.mjs : un SVG
 * 1200 × 630 au trait, dans le style des illustrations de public/conseils/,
 * puis renseigne `image` et `imageAlt` dans le frontmatter.
 *
 * Jamais d'exception : sans illustration, l'article paraît quand même
 * (la liste /conseils affiche alors son motif par défaut).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { readJson, ROOT, RUN_FILE, chat, hasLlmKey } from "./lib.mjs";

const MAX_BYTES = 60_000;

const run = readJson(RUN_FILE, null);
if (!run?.slug) {
  console.log("Aucun article écrit pendant ce cycle : pas d'illustration.");
  process.exit(0);
}
if (!hasLlmKey()) {
  console.error("MISTRAL_API_KEY manquante : pas d'illustration.");
  process.exit(0);
}

const file = resolve(ROOT, `content/articles/${run.slug}.mdx`);
const article = matter(readFileSync(file, "utf8"));
if (article.data.image) {
  console.log(`L'article a déjà une image (${article.data.image}).`);
  process.exit(0);
}

const STYLE_EXAMPLE = readFileSync(resolve(ROOT, "public/conseils/daact-declaration-achevement-travaux.svg"), "utf8");

const SYSTEM = `Tu dessines les illustrations de couverture du site « Permis by ID Maîtrise » (permis de construire de maisons individuelles). Style : dessin d'architecte au trait, sobre, sans personnages réalistes ni logo, avec très peu de texte (quelques mots au plus, en français).

Contraintes techniques strictes :
- Un seul élément <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-labelledby="…">, avec un <title> en premier enfant qui décrit l'image en une phrase (il sert de texte alternatif).
- Palette : fond #f2f0eb, traits #1b1f1d, accent #a9884f, gris #939b96, blanc translucide. Rien d'autre.
- Formes vectorielles seulement : pas de <script>, <image>, <foreignObject>, <style>, d'attribut on…, de lien externe ni de police web.
- Moins de 50 Ko.
- Réponds UNIQUEMENT avec le code SVG, sans bloc de code ni commentaire autour.

Exemple du style attendu :
${STYLE_EXAMPLE}`;

/** Renvoie le SVG nettoyé, ou une raison de refus. */
function check(svg) {
  svg = svg.trim().replace(/^```(?:svg|xml)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!/^<svg[\s>]/.test(svg) || !/<\/svg>$/.test(svg)) return { error: "réponse qui n'est pas un SVG" };
  if (Buffer.byteLength(svg) > MAX_BYTES) return { error: "SVG trop lourd" };
  if (!/viewBox="0 0 1200 630"/.test(svg)) return { error: "viewBox incorrect" };
  if (/<(script|image|foreignObject|style|iframe|use)\b|\son\w+\s*=|(?:xlink:)?href\s*=|url\(\s*["']?(?!#)/i.test(svg)) return { error: "élément ou attribut interdit" };
  const title = svg.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1]?.trim();
  if (!title) return { error: "<title> manquant" };
  return { svg, alt: title.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&") };
}

const user = `Article : « ${article.data.title} »
Résumé : ${article.data.description}

Dessine l'illustration de couverture de cet article.`;

let result = { error: "aucune tentative" };
for (let attempt = 1; attempt <= 2 && result.error; attempt++) {
  try {
    result = check(await chat({ system: SYSTEM, user, maxTokens: 16000 }));
  } catch (e) {
    result = { error: e.message };
  }
  if (result.error) console.warn(`Illustration refusée (tentative ${attempt}) : ${result.error}`);
}
if (result.error) {
  console.warn("Pas d'illustration pour cet article.");
  process.exit(0);
}

mkdirSync(resolve(ROOT, "public/conseils"), { recursive: true });
writeFileSync(resolve(ROOT, `public/conseils/${run.slug}.svg`), result.svg + "\n");
article.data.image = `/conseils/${run.slug}.svg`;
article.data.imageAlt = result.alt;
writeFileSync(file, matter.stringify(article.content, article.data));
console.log(`Illustration ajoutée : public/conseils/${run.slug}.svg`);
