import { NextResponse } from "next/server";
import { writeContentFile } from "@/lib/adminContent";
import type { Realisation } from "@data/realisations";

export const runtime = "nodejs";

const PATH = "data/realisations.ts";

const HEADER = `/**
 * Réalisations réelles (permis obtenus). Remplace la galerie de photos
 * d'illustration (src/components/Gallery.tsx) dès que 3 entrées ou plus
 * existent ici — voir src/components/RealisationsGallery.tsx.
 *
 * Ne pas ajouter de projet fictif : chaque entrée doit correspondre à un
 * permis réellement obtenu, avec des images dont vous détenez les droits.
 * Déposez les images dans public/realisations/ et référencez-les par leur
 * nom de fichier ci-dessous.
 */
export interface Realisation {
  titre: string;
  commune: string;
  departement: string;
  surface: number; // m² de surface de plancher
  formule: "essentiel" | "complet" | "premium";
  annee: number;
  images: string[]; // noms de fichiers dans public/realisations/
  piecesMontrees: string[]; // ex. ["PCMI 2", "PCMI 6"]
  permisAccorde: boolean;
}
`;

const PLANS = new Set(["essentiel", "complet", "premium"]);

function sanitize(input: unknown): Realisation[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((r): Realisation | null => {
      if (typeof r !== "object" || r === null) return null;
      const o = r as Record<string, unknown>;
      const titre = String(o.titre ?? "").trim();
      const commune = String(o.commune ?? "").trim();
      if (!titre || !commune) return null;
      const formule = PLANS.has(String(o.formule)) ? (o.formule as Realisation["formule"]) : "essentiel";
      return {
        titre,
        commune,
        departement: String(o.departement ?? "").trim(),
        surface: Number(o.surface) || 0,
        formule,
        annee: Number(o.annee) || new Date().getFullYear(),
        images: Array.isArray(o.images) ? o.images.map(String).filter(Boolean) : [],
        piecesMontrees: Array.isArray(o.piecesMontrees) ? o.piecesMontrees.map(String).filter(Boolean) : [],
        permisAccorde: Boolean(o.permisAccorde),
      };
    })
    .filter((r): r is Realisation => r !== null);
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }

  const realisations = sanitize((body as { realisations?: unknown })?.realisations);
  const file = `${HEADER}\nexport const realisations: Realisation[] = ${JSON.stringify(realisations, null, 2)};\n`;

  try {
    await writeContentFile(PATH, file, "admin: mise à jour des réalisations");
  } catch (err) {
    console.error("[admin/realisations] écriture échouée", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
