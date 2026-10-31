import { NextResponse } from "next/server";
import { echeancierPrevisionnel, mentionFacturation } from "@/lib/commande";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { ipOf, rateLimited } from "@/lib/mailer";
import { lireDevis } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";
import { jourParis } from "@/lib/suivi";

export const runtime = "nodejs";

const MAX_LECTURES_PAR_FENETRE = 30;

/** Le devis tel que Qonto l'a établi, avec l'échéancier prévisionnel, pour l'étape « Devis » du tunnel. */
export async function GET(req: Request) {
  if (rateLimited(`commande-devis:${ipOf(req)}`, MAX_LECTURES_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de requêtes." }, { status: 429 });
  }
  const signable = commandeDuJeton(new URL(req.url).searchParams.get("jeton"));
  if (!signable) return NextResponse.json({ ok: false, error: "Commande introuvable ou expirée. Recommencez votre commande." }, { status: 404 });

  try {
    const devis = await lireDevis(await ouvrirQonto(), signable.donnees.devisId);
    const { echeancier } = signable.commande;
    return NextResponse.json({
      ok: true,
      devis,
      mention: mentionFacturation(echeancier),
      prelevements: echeancierPrevisionnel(echeancier, jourParis(new Date())),
    });
  } catch (err) {
    console.error("[commande/devis] lecture du devis échouée", err);
    return NextResponse.json({ ok: false, error: "Votre devis est momentanément indisponible. Réessayez dans quelques instants." }, { status: 502 });
  }
}
