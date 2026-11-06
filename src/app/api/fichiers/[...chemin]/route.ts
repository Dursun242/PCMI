import { r2Configure, r2Lire } from "@/lib/r2";

export const runtime = "nodejs";

/**
 * Sert un fichier du compartiment R2 privé (r2.ts). Les chemins sont uniques et jamais réécrits : le CDN de Vercel
 * garde le fichier un an, et R2 n'est relu qu'au premier téléchargement.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ chemin: string[] }> }) {
  if (!r2Configure()) return new Response("Stockage non configuré.", { status: 501 });
  const chemin = (await params).chemin.map(decodeURIComponent).join("/");
  try {
    const r = await r2Lire(chemin);
    if (!r) return new Response("Fichier introuvable.", { status: 404 });
    return new Response(r.body, {
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "application/octet-stream",
        ...(r.headers.get("content-length") ? { "Content-Length": r.headers.get("content-length")! } : {}),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("[fichiers]", err);
    return new Response("Fichier indisponible.", { status: 502 });
  }
}
