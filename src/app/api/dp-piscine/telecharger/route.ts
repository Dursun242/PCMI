import { NextResponse } from "next/server";
import { dossierDuClient } from "@/lib/dpPiscineServeur";

export const runtime = "nodejs";

/** Téléchargement du dossier ou du Cerfa, une fois payé. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const d = await dossierDuClient(q.get("id") ?? "", q.get("k") ?? "");
  const f = q.get("f") === "cerfa" ? "cerfa" : "dossier";
  const url = d?.e.paye ? d.e.fichiers?.[f] : undefined;
  if (!url) return NextResponse.json({ ok: false, error: "Fichier indisponible." }, { status: 404 });
  return NextResponse.redirect(new URL(url, req.url), 302);
}
