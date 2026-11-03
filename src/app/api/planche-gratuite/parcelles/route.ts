import { NextResponse } from "next/server";
import { dimensionsEmprise, EMPRISE_MAX_M, parcellesDansEmprise } from "@/lib/cadastreIgn";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Parcelles visibles sur la carte (?bbox=ouest,sud,est,nord en degrés) : la
 * carte les demande quand le visiteur la fait glisser, pour qu'il puisse choisir
 * une parcelle hors des voisines de l'adresse.
 */
export async function GET(req: Request) {
  if (rateLimited(`parcelles:${ipOf(req)}`, 120)) {
    return NextResponse.json({ ok: false, error: "Trop de demandes." }, { status: 429 });
  }
  const b = (new URL(req.url).searchParams.get("bbox") ?? "").split(",").map(Number);
  const valide =
    b.length === 4 && b.every(Number.isFinite) && b[0] < b[2] && b[1] < b[3] && b[0] >= -180 && b[2] <= 180 && b[1] >= -90 && b[3] <= 90;
  if (!valide) return NextResponse.json({ ok: false, error: "Emprise invalide." }, { status: 400 });
  const emprise = b as [number, number, number, number];
  const [l, h] = dimensionsEmprise(emprise);
  if (l > EMPRISE_MAX_M || h > EMPRISE_MAX_M) return NextResponse.json({ ok: true, parcelles: [], tropLarge: true });
  try {
    return NextResponse.json({ ok: true, parcelles: await parcellesDansEmprise(emprise) });
  } catch (err) {
    console.error("[parcelles] cadastre indisponible", err);
    return NextResponse.json({ ok: false, error: "Le cadastre ne répond pas pour le moment." }, { status: 502 });
  }
}
