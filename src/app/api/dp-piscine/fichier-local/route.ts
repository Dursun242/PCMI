import { NextResponse } from "next/server";
import { fichiersEnMemoire } from "@/lib/dpPiscineStore";

export const runtime = "nodejs";

/** Essai local sans Vercel Blob : fichiers du dossier gardés en mémoire. Inactif en production. */
export async function GET(req: Request) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ ok: false }, { status: 404 });
  const p = new URL(req.url).searchParams.get("p") ?? "";
  const f = fichiersEnMemoire().get(p);
  if (!f) return NextResponse.json({ ok: false }, { status: 404 });
  return new NextResponse(new Uint8Array(f), { headers: { "Content-Type": p.endsWith(".jpg") ? "image/jpeg" : "application/pdf" } });
}
