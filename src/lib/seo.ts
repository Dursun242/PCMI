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
    // Next remplace l'objet openGraph du layout au lieu de le fusionner :
    // sans ces valeurs ici, les pages intérieures perdraient fr_FR et le nom du site.
    // Même chose pour l'image générée par src/app/opengraph-image.tsx : une page
    // qui définit son openGraph la masque, il faut la redonner explicitement.
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: site.name,
      ...base.openGraph,
      images: base.openGraph?.images ?? [DEFAULT_SHARE_IMAGE],
      url,
    } as Metadata["openGraph"],
  };
}

/** Image de partage par défaut, servie par src/app/opengraph-image.tsx. */
export const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name} — permis de construire de maison individuelle, prix fixe, partout en France`,
};

/**
 * Image de partage d'un article. Les réseaux sociaux (Facebook, LinkedIn,
 * WhatsApp, X) n'affichent pas le SVG : on le laisse de côté, et la page
 * retombe alors sur l'image de partage par défaut du site.
 */
export function shareableImages(image: string | undefined): { url: string }[] | undefined {
  if (!image || /\.svg$/i.test(image)) return undefined;
  return [{ url: image }];
}
