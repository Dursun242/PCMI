import { NextResponse } from "next/server";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { emailConfirmationClient, emailNouvelleCommande } from "@/lib/emailsCommande";
import { ipOf, rateLimited, sendPair } from "@/lib/mailer";
import { lireDevis, lireMandat } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";
import { jourParis } from "@/lib/suivi";

export const runtime = "nodejs";

const MAX_SIGNATURES_PAR_FENETRE = 5;
const LONGUEUR_MAX_NAVIGATEUR = 300;

/**
 * Signature de la commande (signature électronique simple) : le client a
 * accepté devis, CGV et échéancier depuis le lien reçu par e-mail. La preuve
 * (instant, IP, navigateur, devis, mandat) part dans la fiche interne ; le
 * client reçoit ses documents (support durable, art. L221-13).
 */
export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(`commande-signer:${ip}`, MAX_SIGNATURES_PAR_FENETRE)) {
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
  if (!signable) return NextResponse.json({ ok: false, error: "Ce lien a expiré. Recommencez votre commande." }, { status: 404 });

  try {
    const cfg = await ouvrirQonto();
    const [devis, mandat] = await Promise.all([lireDevis(cfg, signable.donnees.devisId), lireMandat(cfg, signable.donnees.mandatId)]);
    if (!mandat.signe) return NextResponse.json({ ok: false, error: "Votre mandat de prélèvement n'est pas encore validé." }, { status: 409 });

    const maintenant = new Date();
    const preuve = {
      instant: maintenant.toISOString(),
      ip,
      navigateur: (req.headers.get("user-agent") ?? "inconnu").slice(0, LONGUEUR_MAX_NAVIGATEUR),
      executionAnticipee: body.executionAnticipee === true,
    };
    const { commande } = signable;
    const interne = emailNouvelleCommande(commande, devis, mandat, preuve, jourParis(maintenant));
    const client = emailConfirmationClient(commande, devis);
    await sendPair({
      subject: interne.subject,
      internalHtml: interne.html,
      replyTo: commande.coordonnees.email,
      clientSubject: client.subject,
      clientHtml: client.html,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[commande/signer] signature non enregistrée", err);
    return NextResponse.json({ ok: false, error: "La signature n'a pas pu être enregistrée. Réessayez dans quelques instants." }, { status: 502 });
  }
}
