import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo";

/*
 * Image de partage par défaut (WhatsApp, LinkedIn, Facebook, X), générée au
 * build aux couleurs du site. Un article avec sa propre photo la remplace ;
 * withSeo la redonne aux pages qui définissent leur propre openGraph.
 */
export const alt = DEFAULT_SHARE_IMAGE.alt;
export const size = { width: DEFAULT_SHARE_IMAGE.width, height: DEFAULT_SHARE_IMAGE.height };
export const contentType = "image/png";

const FOREST = "#22352c";
const BRASS = "#a9884f";
const BRASS_LIGHT = "#d9c69d";
const PAPER = "#fcfbf9";

function font(pkg: string, file: string) {
  return readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));
}

export default async function OpengraphImage() {
  const [cormorant, lato] = await Promise.all([
    font("cormorant-garamond", "cormorant-garamond-latin-600-normal.woff"),
    font("lato", "lato-latin-700-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: FOREST, color: PAPER, fontFamily: "Lato" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 2, background: BRASS }} />
          <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: BRASS_LIGHT }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Cormorant", fontSize: 84, lineHeight: 1.05, maxWidth: 960 }}>
            Le permis de construire de votre maison, à prix fixe.
          </div>
          <div style={{ marginTop: 32, fontSize: 30, color: BRASS_LIGHT }}>Dossier PCMI complet · dépôt en mairie · partout en France</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: PAPER, opacity: 0.8 }}>
          <span>{site.url.replace(/^https?:\/\//, "")}</span>
          <span>Bureau d&apos;études · {site.address.city}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: cormorant, weight: 600, style: "normal" },
        { name: "Lato", data: lato, weight: 700, style: "normal" },
      ],
    },
  );
}
