import { NextResponse } from "next/server";
import { ipOf, rateLimited } from "@/lib/mailer";
import { appareilDeLAdmin } from "@/lib/adminAuth";
import { nettoyerBilan } from "@/lib/bilan";
import { estTypeSuivi } from "@/lib/suivi";
import { nettoyerSuite } from "@/lib/suite";
import { d1Configure } from "@/lib/d1";
import { enregistrer } from "@/lib/suiviStore";

export const runtime = "nodejs";

/** Une vraie visite ne déclenche que quelques événements ; au-delà, c'est un abus. */
const MAX_PAR_FENETRE = 30;
/** Contacts : toujours comptés. Visites (vue, bilan, suite) : seulement avec D1. */
const TYPES_COMPTES: string[] = ["formulaire", "appel", "whatsapp"];
const TYPES_VISITE: string[] = ["vue", "bilan", "suite"];
const ROBOTS = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor/i;

/**
 * Reçoit les événements du navigateur (vue, formulaire commencé, clics sur
 * Appeler et WhatsApp, bilan de visite, suite du parcours sur le site). Les demandes envoyées, elles, sont comptées côté
 * serveur par /api/express, pour ne dépendre d'aucun script bloqué.
 * Répond toujours 204 : le navigateur n'a rien à faire de la réponse.
 */
export async function POST(req: Request) {
  const vide = new NextResponse(null, { status: 204 });
  if (ROBOTS.test(req.headers.get("user-agent") ?? "")) return vide;
  // Vos propres passages sur la page ne comptent pas.
  if (await appareilDeLAdmin(req.headers.get("cookie"))) return vide;
  if (rateLimited(`suivi:${ipOf(req)}`, MAX_PAR_FENETRE)) return vide;

  let body: { type?: unknown; ads?: unknown; bilan?: unknown; suite?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return vide;
  }
  // Les demandes ne passent pas par ici : elles sont comptées à l'envoi réel.
  if (!estTypeSuivi(body.type) || body.type.startsWith("demande")) return vide;
  // Vues, bilans et suites : enregistrés seulement dans Cloudflare D1 (le quota de Vercel Blob ne les supporte
  // pas : 75 % consommés le 06/11/2026). Les anciennes tranches de temps envoyées seules ne servent plus.
  if (!TYPES_COMPTES.includes(body.type) && !(d1Configure() && TYPES_VISITE.includes(body.type))) return vide;
  const source = body.ads === true ? "ads" : "direct";

  if (body.type === "bilan") {
    const bilan = nettoyerBilan(body.bilan);
    if (bilan) await enregistrer("bilan", source, { bilan });
    return vide;
  }
  if (body.type === "suite") {
    const suite = nettoyerSuite(body.suite);
    if (suite) await enregistrer("suite", source, { suite });
    return vide;
  }
  await enregistrer(body.type, source);
  return vide;
}
