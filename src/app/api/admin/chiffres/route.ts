import { NextResponse } from "next/server";
import { writeContentFile } from "@/lib/adminContent";

export const runtime = "nodejs";

const PATH = "data/chiffres.ts";

const HEADER = `/**
 * Chiffres de preuve affichés sur l'accueil (section juste sous le hero).
 * Chaque champ est optionnel : un chiffre non renseigné n'apparaît pas.
 * Ne renseignez que des chiffres réels, vérifiables.
 */
export interface ChiffresCles {
  permisDeposes?: number; // nombre de permis déposés à ce jour
  tauxAccordPremierDepot?: number; // en %, ex. 96
  noteGoogle?: number; // sur 5, ex. 4.9
}
`;

interface ChiffresInput {
  permisDeposes?: string;
  tauxAccordPremierDepot?: string;
  noteGoogle?: string;
}

function toNumberOrUndefined(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function PUT(req: Request) {
  let body: ChiffresInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }

  const chiffres: Record<string, number> = {};
  const permisDeposes = toNumberOrUndefined(body.permisDeposes);
  const tauxAccordPremierDepot = toNumberOrUndefined(body.tauxAccordPremierDepot);
  const noteGoogle = toNumberOrUndefined(body.noteGoogle);
  if (permisDeposes !== undefined) chiffres.permisDeposes = permisDeposes;
  if (tauxAccordPremierDepot !== undefined) chiffres.tauxAccordPremierDepot = tauxAccordPremierDepot;
  if (noteGoogle !== undefined) chiffres.noteGoogle = noteGoogle;

  const body_ts = Object.keys(chiffres).length
    ? `{\n${Object.entries(chiffres)
        .map(([k, v]) => `  ${k}: ${v},`)
        .join("\n")}\n}`
    : "{}";

  const file = `${HEADER}\nexport const chiffresCles: ChiffresCles = ${body_ts};\n`;

  try {
    await writeContentFile(PATH, file, "admin: mise à jour des chiffres clés");
  } catch (err) {
    console.error("[admin/chiffres] écriture échouée", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
