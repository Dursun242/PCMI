import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { site } from "@/config/site";

/**
 * Surcharges de métadonnées écrites par le moteur SEO (scripts/seo/optimize.mjs)
 * dans seo/meta-overrides.json. Une page appelle withSeo("/tarifs", {...}) :
 * si le moteur a trouvé un meilleur titre ou une meilleure description
 * (CTR faible malgré une bonne position), ils remplacent ceux du code.
 */
interface Override {
  title?: string;
  description?: string;
  reason?: string;
  since?: string;
}

let cache: Record<string, Override> | null = null;

function overrides(): Record<string, Override> {
  if (cache) return cache;
  const file = join(process.cwd(), "seo/meta-overrides.json");
  try {
    cache = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Record<string, Override>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

/**
 * Point unique pour le titre/description (avec surcharges SEO), l'URL
 * canonique et l'og:url d'une page : évite de répéter le chemin et
 * d'oublier openGraph.url (qui, sinon, hérite de celui de la racine).
 */
export function withSeo(path: string, base: Metadata & { title: string; description: string }): Metadata {
  const o = overrides()[path];
  const url = `${site.url}${path}`;
  return {
    ...base,
    title: o?.title ?? base.title,
    description: o?.description ?? base.description,
    alternates: { ...base.alternates, canonical: path },
    openGraph: { ...base.openGraph, url },
  };
}
