import { NextResponse } from "next/server";
import { appareilDeLAdmin } from "@/lib/adminAuth";
import { ipOf, rateLimited } from "@/lib/mailer";
import { estEtapeDp } from "@/lib/suiviDp";
import { enregistrerDp, suiviDpConfigure } from "@/lib/suiviDpStore";

export const runtime = "nodejs";

/** Un parcours complet ne franchit que neuf étapes ; au-delà, c'est un abus. */
const MAX_PAR_FENETRE = 30;
const ROBOTS = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor/i;

/**
 * Reçoit les étapes du parcours DP piscine (lib/suiviDp.ts) et les compte dans Cloudflare D1 (suiviDpStore),
 * pour /admin/dp-piscine. Sans D1, rien n'est écrit.
 * Répond toujours 204 : le navigateur n'a rien à faire de la réponse.
 */
export async function POST(req: Request) {
  const vide = new NextResponse(null, { status: 204 });
  if (!suiviDpConfigure() || ROBOTS.test(req.headers.get("user-agent") ?? "")) return vide;
  // Vos propres essais du parcours ne comptent pas.
  if (await appareilDeLAdmin(req.headers.get("cookie"))) return vide;
  if (rateLimited(`dp-mesure:${ipOf(req)}`, MAX_PAR_FENETRE)) return vide;

  let etape: unknown;
  try {
    etape = (JSON.parse(await req.text()) as { etape?: unknown }).etape;
  } catch {
    return vide;
  }
  // « Payé » est compté par le serveur à la confirmation de Qonto (marquerPaye), jamais sur parole du navigateur.
  if (!estEtapeDp(etape) || etape === "paye") return vide;
  await enregistrerDp(etape);
  return vide;
}
