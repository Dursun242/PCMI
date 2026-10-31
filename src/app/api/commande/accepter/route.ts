import { NextResponse } from "next/server";
import { commandeDuJeton, jetonAccepte } from "@/lib/commandeServeur";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

const MAX_ACCEPTATIONS_PAR_FENETRE = 10;
const LONGUEUR_MAX_NAVIGATEUR = 300;

/**
 * Acceptation du devis, des CGV et de l'échéancier (signature électronique
 * simple) : la preuve (instant, IP, navigateur, exécution anticipée) est
 * ajoutée au jeton de la commande, qui sera finalisée une fois le mandat signé.
 */
export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(`commande-accepter:${ip}`, MAX_ACCEPTATIONS_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let body: { jeton?: unknown; accepte?: unknown; executionAnticipee?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }
  if (body.accepte !== true) {
    return NextResponse.json({ ok: false, error: "Merci d'accepter le devis, l'échéancier et les conditions générales de vente." }, { status: 400 });
  }
  const signable = commandeDuJeton(body.jeton);
  if (!signable) return NextResponse.json({ ok: false, error: "Commande introuvable ou expirée. Recommencez votre commande." }, { status: 404 });

  const jeton = jetonAccepte(signable.donnees, {
    instant: new Date().toISOString(),
    ip,
    navigateur: (req.headers.get("user-agent") ?? "inconnu").slice(0, LONGUEUR_MAX_NAVIGATEUR),
    executionAnticipee: body.executionAnticipee === true,
  });
  return NextResponse.json({ ok: true, jeton });
}
