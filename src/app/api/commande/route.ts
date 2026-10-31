import { NextResponse } from "next/server";
import { validerCommande } from "@/lib/commande";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

const MAX_COMMANDES_PAR_FENETRE = 5;

/**
 * Réception d'une commande en ligne.
 *
 * Étape actuelle : la commande est vérifiée et recalculée côté serveur (prix,
 * options autorisées, échéancier). La suite — création du client, du devis et
 * du mandat chez Qonto, puis redirection vers la saisie de l'IBAN — arrive
 * avec le branchement Qonto ; d'ici là, la route le dit sans rien enregistrer.
 */
export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(`commande:${ip}`, MAX_COMMANDES_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Commande illisible." }, { status: 400 });
  }

  // Pot de miel : un robot le remplit, un humain ne le voit pas.
  if (typeof body === "object" && body !== null && "website" in body && (body as { website: unknown }).website) {
    return NextResponse.json({ ok: true });
  }

  const resultat = validerCommande(body);
  if (!resultat.ok) return NextResponse.json({ ok: false, error: resultat.erreur }, { status: 400 });

  return NextResponse.json(
    { ok: false, error: "Le règlement en ligne ouvre très bientôt. En attendant, demandez votre devis : nous vous répondons sous 4 h ouvrées." },
    { status: 503 },
  );
}
