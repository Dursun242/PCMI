import { NextResponse } from "next/server";
import { validerCommande } from "@/lib/commande";
import { jetonPour, optionsRetenues } from "@/lib/commandeServeur";
import { ipOf, rateLimited } from "@/lib/mailer";
import { configQonto, creerCommandeQonto, ErreurQonto } from "@/lib/qonto";
import { jourParis } from "@/lib/suivi";

export const runtime = "nodejs";

const MAX_COMMANDES_PAR_FENETRE = 5;

/**
 * Réception d'une commande en ligne : vérification (prix, options, terrain,
 * échéancier recalculés), puis création chez Qonto du client, du devis et du
 * mandat SEPA. Répond avec la page Qonto de saisie de l'IBAN et le jeton qui
 * permet de suivre le mandat puis de signer la commande.
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

  const cfg = configQonto();
  if (!cfg) {
    console.error("[commande] QONTO_LOGIN / QONTO_SECRET_KEY absentes : commande non créée");
    return NextResponse.json({ ok: false, error: "Le règlement en ligne est momentanément indisponible. Réessayez plus tard." }, { status: 503 });
  }

  try {
    const qonto = await creerCommandeQonto(cfg, resultat.commande, jourParis(new Date()));
    const jeton = jetonPour(resultat.commande, qonto, optionsRetenues((body as { panier?: unknown }).panier));
    return NextResponse.json({ ok: true, urlMandat: qonto.urlMandat, jeton });
  } catch (err) {
    if (err instanceof ErreurQonto) console.error(`[commande] ${err.message}`, err.detail);
    else console.error("[commande] création chez Qonto échouée", err);
    return NextResponse.json(
      { ok: false, error: "La préparation de votre commande a échoué. Réessayez dans quelques minutes." },
      { status: 502 },
    );
  }
}
