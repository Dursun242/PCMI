import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

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

export function withSeo(path: string, base: Metadata & { title: string; description: string }): Metadata {
  const o = overrides()[path];
  if (!o) return base;
  return {
    ...base,
    title: o.title ?? base.title,
    description: o.description ?? base.description,
  };
}
