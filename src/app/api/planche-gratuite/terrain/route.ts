import { NextResponse } from "next/server";
import { rechercherTerrain } from "@/lib/cadastreIgn";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Recherche du terrain pour la planche gratuite : l'adresse saisie, et les
 * parcelles cadastrales autour, pour que le visiteur confirme la sienne.
 */
export async function GET(req: Request) {
  if (rateLimited(`terrain:${ipOf(req)}`, 30)) {
    return NextResponse.json({ ok: false, error: "Trop de recherches. Réessayez dans quelques minutes." }, { status: 429 });
  }
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 160);
  if (q.length < 5) {
    return NextResponse.json({ ok: false, error: "Saisissez l'adresse du terrain : numéro, voie et commune." }, { status: 400 });
  }
  try {
    const r = await rechercherTerrain(q);
    if (!r) return NextResponse.json({ ok: false, error: "Adresse introuvable. Vérifiez la commune ou le code postal." }, { status: 404 });
    if (r.parcelles.length === 0) {
      return NextResponse.json({ ok: false, error: "Aucune parcelle trouvée près de cette adresse." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    console.error("[planche] recherche du terrain impossible", err);
    return NextResponse.json(
      { ok: false, error: "Le cadastre ne répond pas pour le moment. Réessayez dans un instant." },
      { status: 502 },
    );
  }
}
