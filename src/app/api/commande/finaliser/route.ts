import { NextResponse } from "next/server";
import { commandeDuJeton, finaliserCommande } from "@/lib/commandeServeur";
import { ipOf, rateLimited } from "@/lib/mailer";
import { ouvrirQonto } from "@/lib/qontoConnexion";
import { suivreCommande } from "@/lib/suiviCommandeStore";

export const runtime = "nodejs";

const MAX_FINALISATIONS_PAR_FENETRE = 5;

/** Dernière étape : devis accepté et mandat signé, la commande est confirmée et les e-mails partent. */
export async function POST(req: Request) {
  if (rateLimited(`commande-finaliser:${ipOf(req)}`, MAX_FINALISATIONS_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let jeton: unknown;
  try {
    jeton = ((await req.json()) as { jeton?: unknown }).jeton;
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }
  const signable = commandeDuJeton(jeton);
  if (!signable) return NextResponse.json({ ok: false, error: "Commande introuvable ou expirée. Recommencez votre commande." }, { status: 404 });

  try {
    const r = await finaliserCommande(signable, await ouvrirQonto());
    if (!r.ok) {
      const error = r.raison === "devis-non-accepte" ? "Merci d'accepter d'abord votre devis." : "Votre mandat de prélèvement n'est pas encore validé.";
      return NextResponse.json({ ok: false, error }, { status: 409 });
    }
    const d = signable.donnees;
    if (r.premiere) await suivreCommande(req, "signee", { formule: d.selection.formule, echeances: d.echeances, ads: d.ads });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[commande/finaliser] commande non finalisée", err);
    return NextResponse.json({ ok: false, error: "La confirmation de votre commande a échoué. Réessayez dans quelques instants." }, { status: 502 });
  }
}
