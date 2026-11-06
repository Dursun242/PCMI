import { NextResponse } from "next/server";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

const ALTI = "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json";

/**
 * Profil du terrain naturel (RGE ALTI IGN) le long d'une ligne (?de=lon,lat&a=lon,lat&n=points) : coupe en direct de
 * la DP piscine. Renvoie les altitudes NGF (m) à intervalles réguliers.
 */
export async function GET(req: Request) {
  if (rateLimited(`dp-profil:${ipOf(req)}`, 60)) return NextResponse.json({ ok: false }, { status: 429 });
  const q = new URL(req.url).searchParams;
  const de = (q.get("de") ?? "").split(",").map(Number);
  const a = (q.get("a") ?? "").split(",").map(Number);
  const n = Math.min(120, Math.max(10, Number(q.get("n")) || 60));
  const ok = (p: number[]) => p.length === 2 && p.every(Number.isFinite) && p[0] > -6 && p[0] < 10 && p[1] > 41 && p[1] < 52;
  if (!ok(de) || !ok(a)) return NextResponse.json({ ok: false, error: "Ligne invalide." }, { status: 400 });
  const p = new URLSearchParams({
    lon: `${de[0]}|${a[0]}`,
    lat: `${de[1]}|${a[1]}`,
    resource: "ign_rge_alti_wld",
    sampling: String(n),
    profile_mode: "simple",
  });
  try {
    const r = await fetch(`${ALTI}?${p}`, { signal: AbortSignal.timeout(12_000) });
    if (!r.ok) throw new Error(`altimétrie ${r.status}`);
    const json = (await r.json()) as { elevations?: { z: number }[] };
    const z = (json.elevations ?? []).map((e) => Number(e.z)).filter((v) => Number.isFinite(v) && v > -100 && v < 5000);
    if (z.length < 2) throw new Error("profil vide");
    return NextResponse.json({ ok: true, z });
  } catch (err) {
    console.error("[dp-profil] altimétrie indisponible", err);
    return NextResponse.json({ ok: false, error: "Altitudes indisponibles pour le moment." }, { status: 502 });
  }
}
