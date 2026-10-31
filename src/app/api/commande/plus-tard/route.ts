import { NextResponse } from "next/server";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { emailIbanEnAttente, emailReprise } from "@/lib/emailsCommande";
import { ipOf, rateLimited, sendPair } from "@/lib/mailer";

export const runtime = "nodejs";

const MAX_ENVOIS_PAR_FENETRE = 3;

/**
 * « Je n'ai pas mon RIB sous la main » : le client reçoit un lien pour
 * terminer plus tard (retour direct à l'étape IBAN, devis déjà signé) et
 * l'administrateur une alerte pour pouvoir le rappeler.
 */
export async function POST(req: Request) {
  if (rateLimited(`commande-plus-tard:${ipOf(req)}`, MAX_ENVOIS_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let jeton: unknown;
  try {
    jeton = ((await req.json()) as { jeton?: unknown }).jeton;
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }
  const signable = commandeDuJeton(jeton);
  if (!signable || typeof jeton !== "string") {
    return NextResponse.json({ ok: false, error: "Commande introuvable ou expirée. Recommencez votre commande." }, { status: 404 });
  }
  if (!signable.donnees.acceptation) return NextResponse.json({ ok: false, error: "Merci d'accepter d'abord votre devis." }, { status: 409 });

  const { commande } = signable;
  const url = `${new URL(req.url).origin}/commander/reprendre?jeton=${encodeURIComponent(jeton)}`;
  const client = emailReprise(commande, url);
  const interne = emailIbanEnAttente(commande);
  try {
    await sendPair({
      subject: interne.subject,
      internalHtml: interne.html,
      replyTo: commande.coordonnees.email,
      clientSubject: client.subject,
      clientHtml: client.html,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[commande/plus-tard] e-mail non envoyé", err);
    return NextResponse.json({ ok: false, error: "L'envoi de l'e-mail a échoué. Réessayez dans quelques instants." }, { status: 502 });
  }
}
