import { NextResponse } from "next/server";
import { ipOf, rateLimited } from "@/lib/mailer";
import { appareilDeLAdmin } from "@/lib/adminAuth";
import { nettoyerBilan } from "@/lib/bilan";
import { estTypeSuivi } from "@/lib/suivi";
import { enregistrer } from "@/lib/suiviStore";

export const runtime = "nodejs";

/** Une vraie visite ne déclenche que quelques événements ; au-delà, c'est un abus. */
const MAX_PAR_FENETRE = 30;
const ROBOTS = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor/i;

/**
 * Reçoit les événements du navigateur (vue, formulaire commencé, clics sur
 * Appeler et WhatsApp, bilan de visite). Les demandes envoyées, elles, sont comptées côté
 * serveur par /api/express, pour ne dépendre d'aucun script bloqué.
 * Répond toujours 204 : le navigateur n'a rien à faire de la réponse.
 */
export async function POST(req: Request) {
  const vide = new NextResponse(null, { status: 204 });
  if (ROBOTS.test(req.headers.get("user-agent") ?? "")) return vide;
  // Vos propres passages sur la page ne comptent pas.
  if (await appareilDeLAdmin(req.headers.get("cookie"))) return vide;
  if (rateLimited(`suivi:${ipOf(req)}`, MAX_PAR_FENETRE)) return vide;

  let body: { type?: unknown; ads?: unknown; bilan?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return vide;
  }
  // Les demandes ne passent pas par ici : elles sont comptées à l'envoi réel.
  if (!estTypeSuivi(body.type) || body.type.startsWith("demande")) return vide;
  const source = body.ads === true ? "ads" : "direct";

  if (body.type === "bilan") {
    const bilan = nettoyerBilan(body.bilan);
    if (bilan) await enregistrer("bilan", source, bilan);
    return vide;
  }
  await enregistrer(body.type, source);
  return vide;
}
