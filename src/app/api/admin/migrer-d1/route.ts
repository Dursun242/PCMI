import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { d1Configure, docEcrire, evtAjouterLot } from "@/lib/d1";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Recopie unique de Vercel Blob vers Cloudflare D1 (06/11/2026) : registre des planches gratuites, compteurs,
 * commandes finalisées et dossiers DP piscine déjà enregistrés. Protégée par le middleware /api/admin. Sans risque
 * à relancer : les clés sont les mêmes, une recopie remplace la précédente. Les fichiers (PDF, photos) restent dans
 * Blob ; les jetons Qonto se recopient seuls à leur première lecture. Coût Blob : une opération par tranche de
 * 1 000 fichiers listés.
 */
async function tous(prefix: string) {
  const blobs: { pathname: string; url: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return blobs;
}

const json = async (url: string) => {
  const r = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  return r.ok ? ((await r.json()) as Record<string, unknown>) : null;
};

export async function POST() {
  if (!d1Configure() || !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: false, error: "D1 ou Blob non configuré." }, { status: 501 });
  }
  const bilan: Record<string, number> = {};
  try {
    const suivi = await tous("suivi/");
    await evtAjouterLot(suivi.map((b) => ({ chemin: b.pathname, instant: b.uploadedAt.getTime() })));
    bilan.evenements = suivi.length;

    const planches = await tous("planches-gratuites/");
    for (const b of planches) {
      const v = await json(b.url);
      if (v) await docEcrire(b.pathname, v, Number(v.maj) || b.uploadedAt.getTime());
    }
    bilan.planches = planches.length;

    const commandes = await tous("commandes-finalisees/");
    for (const b of commandes) {
      const cle = b.pathname.slice("commandes-finalisees/".length, "commandes-finalisees/".length + 32);
      await docEcrire(`commandes-finalisees/${cle}`, b.uploadedAt.getTime(), b.uploadedAt.getTime());
    }
    bilan.commandes = commandes.length;

    const dp = (await tous("dp-piscine/")).filter((b) => b.pathname.endsWith(".json"));
    for (const b of dp) {
      const v = await json(b.url);
      if (!v) continue;
      const le = Number(v._le) || b.uploadedAt.getTime();
      // ancienne entrée d'un seul fichier (« <prefixe>.json ») : devient la facette « base »
      const cle = /^dp-piscine\/[^/]+\.json$/.test(b.pathname) ? b.pathname.replace(/\.json$/, "/base.json") : b.pathname;
      await docEcrire(cle, { ...v, _le: le }, le);
    }
    bilan.dpPiscine = dp.length;
    return NextResponse.json({ ok: true, bilan });
  } catch (err) {
    console.error("[migrer-d1]", err);
    return NextResponse.json({ ok: false, bilan, error: String(err) }, { status: 502 });
  }
}
