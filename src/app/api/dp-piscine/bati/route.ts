import { NextResponse } from "next/server";
import { dimensionsEmprise } from "@/lib/cadastreIgn";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

const WFS = "https://data.geopf.fr/wfs/ows";

/**
 * Bâtiments (BD TOPO IGN) autour du terrain (?bbox=ouest,sud,est,nord en degrés) : dessinés sur le plan de masse en
 * direct de la DP piscine, et distance du bassin à la maison. Contours seuls, en [longitude, latitude].
 */
export async function GET(req: Request) {
  if (rateLimited(`dp-bati:${ipOf(req)}`, 60)) return NextResponse.json({ ok: false }, { status: 429 });
  const b = (new URL(req.url).searchParams.get("bbox") ?? "").split(",").map(Number);
  if (b.length !== 4 || !b.every(Number.isFinite) || b[0] >= b[2] || b[1] >= b[3]) {
    return NextResponse.json({ ok: false, error: "Emprise invalide." }, { status: 400 });
  }
  const [l, h] = dimensionsEmprise(b as [number, number, number, number]);
  if (l > 400 || h > 400) return NextResponse.json({ ok: true, batiments: [] });
  const q = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: "2.0.0",
    REQUEST: "GetFeature",
    TYPENAMES: "BDTOPO_V3:batiment",
    OUTPUTFORMAT: "application/json",
    COUNT: "300",
    BBOX: `${b[1]},${b[0]},${b[3]},${b[2]},urn:ogc:def:crs:EPSG::4326`,
  });
  try {
    const r = await fetch(`${WFS}?${q}`, { signal: AbortSignal.timeout(12_000), headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`WFS ${r.status}`);
    const json = (await r.json()) as { features?: { geometry?: { type: string; coordinates: number[][][][] | number[][][] } }[] };
    const batiments: [number, number][][] = [];
    for (const f of json.features ?? []) {
      const g = f.geometry;
      if (!g) continue;
      const polys = (g.type === "MultiPolygon" ? g.coordinates : [g.coordinates]) as number[][][][];
      for (const p of polys) if (p[0]?.length >= 4) batiments.push(p[0].map(([x, y]) => [Number(x.toFixed(7)), Number(y.toFixed(7))] as [number, number]));
    }
    return NextResponse.json({ ok: true, batiments });
  } catch (err) {
    console.error("[dp-bati] BD TOPO indisponible", err);
    return NextResponse.json({ ok: true, batiments: [], indisponible: true });
  }
}
