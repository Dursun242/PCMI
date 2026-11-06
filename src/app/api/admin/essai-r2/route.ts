import { NextResponse } from "next/server";
import { r2AdresseEnvoi, r2Configure, r2Ecrire, r2Lire } from "@/lib/r2";

export const runtime = "nodejs";

/** Diagnostic R2 (protégé par le middleware /api/admin) : écriture signée, adresse d'envoi, relecture. */
export async function GET() {
  if (!r2Configure()) return NextResponse.json({ ok: false, error: "R2 non configuré" }, { status: 501 });
  const out: Record<string, unknown> = {};
  try {
    out.ecriture = await r2Ecrire("essais/serveur.txt", Buffer.from("essai serveur"), "text/plain");
    out.lecture = (await r2Lire("essais/serveur.txt"))?.status ?? 404;
    const { envoi } = await r2AdresseEnvoi("essais/presigne.txt", "text/plain");
    const p = await fetch(envoi, { method: "PUT", body: "essai presigne", headers: { "Content-Type": "text/plain" } });
    out.presigne = { status: p.status, corps: (await p.text()).slice(0, 400) };
  } catch (err) {
    out.erreur = String(err);
  }
  return NextResponse.json(out);
}
