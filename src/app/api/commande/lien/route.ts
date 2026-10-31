import { NextResponse } from "next/server";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { emailLienSignature } from "@/lib/emailsCommande";
import { ipOf, rateLimited, sendToClient } from "@/lib/mailer";
import { configQonto, lireMandat } from "@/lib/qonto";

export const runtime = "nodejs";

const MAX_ENVOIS_PAR_FENETRE = 5;

/**
 * Envoie au client le lien de signature de sa commande, une fois son mandat
 * SEPA signé chez Qonto. Le lien pointe vers le site qui a reçu la commande
 * (preview ou production).
 */
export async function POST(req: Request) {
  if (rateLimited(`commande-lien:${ipOf(req)}`, MAX_ENVOIS_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let jeton: unknown;
  try {
    jeton = ((await req.json()) as { jeton?: unknown }).jeton;
  } catch {
    return NextResponse.json({ ok: false, error: "Requête illisible." }, { status: 400 });
  }
  const signable = commandeDuJeton(jeton);
  const cfg = configQonto();
  if (!signable || !cfg || typeof jeton !== "string") {
    return NextResponse.json({ ok: false, error: "Commande introuvable ou expirée." }, { status: 404 });
  }

  try {
    const mandat = await lireMandat(cfg, signable.donnees.mandatId);
    if (!mandat.signe) return NextResponse.json({ ok: false, error: "Le mandat n'est pas encore signé." }, { status: 409 });

    const url = `${new URL(req.url).origin}/commander/signer?jeton=${encodeURIComponent(jeton)}`;
    const { prenom, email } = signable.commande.coordonnees;
    await sendToClient({ to: email, ...emailLienSignature(prenom, url) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[commande/lien] envoi du lien échoué", err);
    return NextResponse.json({ ok: false, error: "L'envoi de l'e-mail a échoué. Réessayez dans quelques instants." }, { status: 502 });
  }
}
