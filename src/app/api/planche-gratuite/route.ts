import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { emailInterneDemande, emailInterneRefus, type ContactPlanche, type ContextePlanche } from "@/lib/emailsPlanche";
import { ipOf, rateLimited, sendInternal } from "@/lib/mailer";
import { nomCartouche, referenceCourte, validerDemande, type DemandePlanche } from "@/lib/planche";
import { declencherPlanche } from "@/lib/plancheGithub";
import { chiffrer, empreinteParcelle, secretPlanche, signerRappel, VALIDITE_RAPPEL_MS } from "@/lib/plancheSecret";
import { ecrirePlanche, lirePlanche, majPlanche, parcellePrise } from "@/lib/plancheStore";

export const runtime = "nodejs";

/**
 * Demande de planche gratuite : une seule par parcelle. La planche est
 * dessinée par l'outil PCMI (workflow GitHub d'id-plans), qui la renvoie à
 * /api/planche-gratuite/livraison ; c'est là qu'elle part au visiteur.
 */

const contexte = (d: DemandePlanche): ContextePlanche => ({
  planche: d.planche,
  reference: referenceCourte(d.idu),
  commune: d.commune || d.ville,
  adresse: `${d.voie}, ${d.ville}`,
});

/** Base de l'adresse de rappel : le site lui-même (surchargée seulement pour un essai local). */
const baseRappel = () => process.env.PLANCHE_RAPPEL_BASE || site.url;

async function prevenir(mail: { subject: string; html: string }, replyTo: string) {
  try {
    await sendInternal({ ...mail, replyTo });
  } catch (err) {
    console.error("[planche] e-mail interne non envoyé", err);
  }
}

export async function POST(req: Request) {
  if (rateLimited(`planche:${ipOf(req)}`, 5)) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let corps: Record<string, unknown>;
  try {
    corps = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Demande illisible." }, { status: 400 });
  }
  // Pot de miel : un robot le remplit, un humain ne le voit pas.
  if (typeof corps.site_web === "string" && corps.site_web) return NextResponse.json({ ok: true });

  const v = validerDemande(corps);
  if ("erreurs" in v) return NextResponse.json({ ok: false, erreurs: v.erreurs }, { status: 400 });
  const d = v.demande;

  const contact: ContactPlanche = { prenom: d.prenom, nom: d.nom, email: d.email };
  const x = contexte(d);

  // Sans secret, ni registre ni rappel signé : la demande reste reçue, et part à la main.
  const secret = secretPlanche();
  if (!secret) {
    console.error("[planche] PLANCHE_SECRET (ou ADMIN_SESSION_SECRET) absent : demande transmise à la main");
    await prevenir(emailInterneDemande(contact, x, true), d.email);
    return NextResponse.json({ ok: true, manuel: true });
  }
  const empreinte = empreinteParcelle(d.idu, secret);

  try {
    const existante = await lirePlanche(empreinte);
    if (parcellePrise(existante)) {
      await prevenir(emailInterneRefus(contact, x), d.email);
      return NextResponse.json({ ok: false, deja: true }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const maintenant = Date.now();
    await ecrirePlanche({
      id,
      empreinte,
      planche: d.planche,
      commune: x.commune,
      reference: x.reference,
      cree: maintenant,
      maj: maintenant,
      statut: "en_cours",
      contact: chiffrer(JSON.stringify(contact), secret),
    });

    const expire = maintenant + VALIDITE_RAPPEL_MS;
    const rappel = new URL("/api/planche-gratuite/livraison", baseRappel());
    rappel.search = new URLSearchParams({
      id,
      e: empreinte,
      x: String(expire),
      s: signerRappel(id, empreinte, expire, secret),
    }).toString();

    let lancee = false;
    try {
      lancee = await declencherPlanche({
        planche: d.planche,
        adresse: d.voie,
        ville: d.ville,
        client: nomCartouche(d),
        parcelle: d.idu,
        rappel: rappel.toString(),
      });
    } catch (err) {
      console.error("[planche] lancement impossible", err);
    }
    if (!lancee) await majPlanche(empreinte, { statut: "echec", erreur: "Lancement automatique impossible" });
    await prevenir(emailInterneDemande(contact, x, !lancee), d.email);
    return NextResponse.json({ ok: true, manuel: !lancee });
  } catch (err) {
    console.error("[planche] demande non enregistrée", err);
    return NextResponse.json({ ok: false, error: "La demande n'a pas pu être enregistrée. Réessayez." }, { status: 502 });
  }
}
