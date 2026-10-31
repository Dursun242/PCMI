import { NextResponse } from "next/server";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { ipOf, rateLimited } from "@/lib/mailer";
import { lireMandat } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";

export const runtime = "nodejs";

/** Le tunnel interroge cette route toutes les quelques secondes pendant la saisie de l'IBAN. */
const MAX_LECTURES_PAR_FENETRE = 200;

/** Le mandat SEPA de la commande est-il signé ? */
export async function GET(req: Request) {
  if (rateLimited(`commande-statut:${ipOf(req)}`, MAX_LECTURES_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de requêtes." }, { status: 429 });
  }
  const signable = commandeDuJeton(new URL(req.url).searchParams.get("jeton"));
  if (!signable) return NextResponse.json({ ok: false, error: "Commande introuvable ou expirée." }, { status: 404 });

  try {
    const mandat = await lireMandat(await ouvrirQonto(), signable.donnees.mandatId);
    return NextResponse.json({ ok: true, signe: mandat.signe });
  } catch (err) {
    console.error("[commande/statut] lecture du mandat échouée", err);
    return NextResponse.json({ ok: false, error: "Lecture du mandat impossible." }, { status: 502 });
  }
}
