import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  updated?: string;
  keywords: string[];
  readingMinutes: number;
  image?: string;
  imageAlt?: string;
}

export interface Article extends ArticleMeta {
  content: string;
}

const DIR = join(process.cwd(), "content/articles");

/** Construit un article à partir du contenu brut d'un fichier MDX (frontmatter inclus). */
export function parseArticle(slug: string, raw: string): Article {
  const { data, content } = matter(raw);
  const words = content.split(/\s+/).length;
  return {
    slug,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    readingMinutes: Math.max(2, Math.round(words / 220)),
    image: data.image ? String(data.image) : undefined,
    imageAlt: data.imageAlt ? String(data.imageAlt) : undefined,
    content,
  };
}

function read(file: string): Article {
  return parseArticle(file.replace(/\.mdx?$/, ""), readFileSync(join(DIR, file), "utf8"));
}

export function getArticles(): Article[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => /\.mdx?$/.test(f) && !f.startsWith("_"))
    .map(read)
    .filter((a) => a.title && a.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getArticle(slug: string): Article | null {
  const safe = slug.replace(/[^a-z0-9-]/g, "");
  for (const ext of [".mdx", ".md"]) {
    if (existsSync(join(DIR, safe + ext))) return read(safe + ext);
  }
  return null;
}
