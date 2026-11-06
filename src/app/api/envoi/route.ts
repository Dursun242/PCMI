import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ALLOWED_TYPES, MAX_FILE_BYTES, ipOf, rateLimited } from "@/lib/mailer";
import { r2AdresseEnvoi, r2Configure } from "@/lib/r2";

export const runtime = "nodejs";

/** Adresses d'envoi par visiteur et par fenêtre de 10 min (comme /api/upload). */
const MAX_PAR_FENETRE = 20;
const DOSSIERS = ["envois", "dp-piscine-photos"] as const;

/**
 * Envoi direct navigateur → Cloudflare R2 (r2.ts, 06/11/2026) : le serveur signe une adresse d'envoi de 10 minutes
 * pour un fichier d'un type autorisé, sous un nom aléatoire. Sans R2, 501 : le navigateur reprend l'ancien envoi
 * vers Vercel Blob (/api/upload).
 */
export async function POST(req: Request) {
  if (!r2Configure()) return NextResponse.json({ error: "Stockage R2 non configuré." }, { status: 501 });
  if (rateLimited(`envoi:${ipOf(req)}`, MAX_PAR_FENETRE)) {
    return NextResponse.json({ error: "Trop d'envois. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let body: { dossier?: unknown; nom?: unknown; type?: unknown; taille?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Demande illisible." }, { status: 400 });
  }
  const dossier = DOSSIERS.find((d) => d === body.dossier);
  const type = typeof body.type === "string" ? body.type : "";
  const taille = typeof body.taille === "number" ? body.taille : NaN;
  if (!dossier || !ALLOWED_TYPES.includes(type) || !(taille > 0 && taille <= MAX_FILE_BYTES)) {
    return NextResponse.json({ error: "Fichier refusé (type ou taille)." }, { status: 400 });
  }
  const nom = String(body.nom ?? "fichier")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(-80) || "fichier";
  const chemin = `${dossier}/${Date.now()}-${randomBytes(8).toString("hex")}-${nom}`;
  try {
    return NextResponse.json(await r2AdresseEnvoi(chemin, type));
  } catch (err) {
    console.error("[envoi]", err);
    return NextResponse.json({ error: "Envoi impossible." }, { status: 502 });
  }
}
