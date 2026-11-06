import { NextResponse } from "next/server";
import { PRIX_DP_PISCINE_TTC, TVA_DP_PISCINE, prixHt } from "@/lib/dpPiscine";
import { dossierDuClient, envoyer, marquerPaye, payable, vueClient } from "@/lib/dpPiscineServeur";
import { majDp } from "@/lib/dpPiscineStore";
import { ipOf, rateLimited, sendInternal } from "@/lib/mailer";
import { creerLienPaiement } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";

export const runtime = "nodejs";

/**
 * Paiement du dossier : lien de paiement Qonto (carte, Apple Pay), réutilisé
 * s'il existe déjà. { test: true } : paiement simulé, réservé à
 * l'administrateur connecté (essai du parcours client de bout en bout).
 */
export async function POST(req: Request) {
  if (rateLimited(`dp-payer:${ipOf(req)}`, 10)) return NextResponse.json({ ok: false }, { status: 429 });
  const corps = (await req.json().catch(() => ({}))) as { id?: string; k?: string; test?: boolean; cgv?: boolean };
  const d = await dossierDuClient(String(corps.id ?? ""), String(corps.k ?? ""));
  if (!d) return NextResponse.json({ ok: false, error: "Dossier introuvable." }, { status: 404 });
  const { e, secret } = d;
  if (e.paye) return NextResponse.json({ ok: true, ...vueClient(e) });
  if (!payable(e)) return NextResponse.json({ ok: false, error: "Ce dossier n'est pas encore prêt." }, { status: 409 });
  if (corps.cgv !== true) return NextResponse.json({ ok: false, error: "Merci d'accepter les conditions générales de vente." }, { status: 400 });

  if (corps.test === true) {
    if (!d.admin) {
      return NextResponse.json({ ok: false, error: "Paiement test réservé à l'administrateur." }, { status: 403 });
    }
    return NextResponse.json({ ok: true, ...vueClient(await marquerPaye(e, secret, "test")) });
  }

  if (e.paiement) return NextResponse.json({ ok: true, url: e.paiement.url });
  try {
    const lien = await creerLienPaiement(await ouvrirQonto(), {
      titre: "Déclaration préalable de piscine",
      description: `Dossier DPC1, DPC2, DPC3 et Cerfa 16702 pré-rempli, parcelle ${e.reference} (${e.commune})`,
      prixHt: prixHt(PRIX_DP_PISCINE_TTC, TVA_DP_PISCINE),
      tva: String(TVA_DP_PISCINE),
    });
    await majDp(e.id, secret, "paiement", { paiement: { lienId: lien.id, url: lien.url, cree: Date.now() } });
    return NextResponse.json({ ok: true, url: lien.url });
  } catch (err) {
    console.error("[dp-piscine] lien de paiement impossible", err);
    await envoyer("alerte paiement", () =>
      sendInternal({
        subject: "[DP piscine] Lien de paiement Qonto impossible",
        html: `<p>Un client veut payer sa DP piscine (${e.reference}, ${e.commune}) mais le lien Qonto n'a pas pu être créé :</p>
               <pre>${String(err instanceof Error ? err.message : err).slice(0, 500)}</pre>
               <p>Reconnecter Qonto dans /admin (droits « liens de paiement »).</p>`,
      }),
    );
    return NextResponse.json(
      { ok: false, error: "Le paiement en ligne est momentanément indisponible. Nous avons été prévenus et revenons vers vous rapidement." },
      { status: 502 },
    );
  }
}
