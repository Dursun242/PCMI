import { NextResponse } from "next/server";
import { ipOf, rateLimited } from "@/lib/mailer";
import { ETAPES_NAVIGATEUR, estEtapeCommande } from "@/lib/suiviCommande";
import { suivreCommande } from "@/lib/suiviCommandeStore";

export const runtime = "nodejs";

/** Un parcours complet envoie quatre événements ; au-delà, c'est un abus. */
const MAX_PAR_FENETRE = 20;

/**
 * Étapes du tunnel vues dans le navigateur (panier, coordonnées, formulaire
 * commencé, règlement). Devis, acceptation, signature et erreurs sont comptés
 * par le serveur, à l'action réelle. Répond toujours 204.
 */
export async function POST(req: Request) {
  const vide = new NextResponse(null, { status: 204 });
  if (rateLimited(`suivi-commande:${ipOf(req)}`, MAX_PAR_FENETRE)) return vide;
  let body: { etape?: unknown; formule?: unknown; echeances?: unknown; ads?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return vide;
  }
  if (!estEtapeCommande(body.etape) || !ETAPES_NAVIGATEUR.includes(body.etape)) return vide;
  await suivreCommande(req, body.etape, body);
  return vide;
}
