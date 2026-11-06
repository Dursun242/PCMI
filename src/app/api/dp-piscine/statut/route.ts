import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { dossierDuClient, verifierPaiement, vueClient } from "@/lib/dpPiscineServeur";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

/** État du dossier pour la page de suivi (interrogée toutes les quelques secondes). */
export async function GET(req: Request) {
  if (rateLimited(`dp-statut:${ipOf(req)}`, 120)) return NextResponse.json({ ok: false }, { status: 429 });
  const q = new URL(req.url).searchParams;
  const k = q.get("k") ?? "";
  const d = await dossierDuClient(q.get("id") ?? "", k);
  if (!d) return NextResponse.json({ ok: false, error: "Dossier introuvable." }, { status: 404 });
  const e = await verifierPaiement(d.e, d.secret, k);
  const admin = await verifySessionToken((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ ok: true, ...vueClient(e), admin });
}
