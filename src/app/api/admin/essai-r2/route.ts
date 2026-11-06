import { NextResponse } from "next/server";
import { AwsClient } from "aws4fetch";
import { r2Configure } from "@/lib/r2";

export const runtime = "nodejs";

/**
 * Diagnostic R2 temporaire (protégé par le middleware /api/admin) : réponse brute de R2 à une écriture, et forme
 * des variables (longueurs seulement, jamais les valeurs).
 */
export async function GET() {
  const e = process.env;
  const forme = {
    compte: (e.CLOUDFLARE_ACCOUNT_ID ?? "").length,
    idCle: (e.R2_ACCESS_KEY_ID ?? "").length,
    idCleEspaces: /\s/.test(e.R2_ACCESS_KEY_ID ?? ""),
    secret: (e.R2_SECRET_ACCESS_KEY ?? "").length,
    secretEspaces: /\s/.test(e.R2_SECRET_ACCESS_KEY ?? ""),
    compartiment: e.R2_BUCKET ?? null,
  };
  if (!r2Configure()) return NextResponse.json({ ok: false, forme, error: "R2 non configuré" }, { status: 501 });
  const aws = new AwsClient({
    accessKeyId: e.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: e.R2_SECRET_ACCESS_KEY!.trim(),
    service: "s3",
    region: "auto",
  });
  const url = `https://${e.CLOUDFLARE_ACCOUNT_ID!.trim()}.r2.cloudflarestorage.com/${e.R2_BUCKET!.trim()}/essais/serveur.txt`;
  const r = await aws.fetch(url, { method: "PUT", body: "essai", headers: { "Content-Type": "text/plain" } });
  return NextResponse.json({ forme, ecriture: r.status, reponse: (await r.text()).slice(0, 600) });
}
