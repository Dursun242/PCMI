import { NextResponse } from "next/server";
import {
  emailClientEchec,
  emailClientPlanche,
  emailInterneEchec,
  emailInterneLivree,
  nomFichierPlanche,
  type ContactPlanche,
  type ContextePlanche,
} from "@/lib/emailsPlanche";
import { sendInternal, sendToClient } from "@/lib/mailer";
import { dechiffrer, secretPlanche, verifierRappel } from "@/lib/plancheSecret";
import { lirePlanche, majPlanche, type EntreePlanche } from "@/lib/plancheStore";

export const runtime = "nodejs";

/**
 * Retour du workflow « Planche gratuite » (id-plans) : le PDF de la planche
 * (application/pdf) ou l'erreur rencontrée (application/json). L'adresse est
 * signée et datée par le site au moment de la demande : personne d'autre ne
 * peut s'en servir, et une seule livraison est envoyée par parcelle.
 */

/** Limite d'une requête vers une fonction Vercel (4,5 Mo), avec une marge. */
const TAILLE_MAX = 4_400_000;

function lireContact(e: EntreePlanche, secret: string): ContactPlanche | null {
  const texte = e.contact ? dechiffrer(e.contact, secret) : null;
  try {
    return texte ? (JSON.parse(texte) as ContactPlanche) : null;
  } catch {
    return null;
  }
}

const contexte = (e: EntreePlanche): ContextePlanche => ({
  planche: e.planche,
  reference: e.reference,
  commune: e.commune,
  adresse: e.commune,
});

async function signalerEchec(e: EntreePlanche, c: ContactPlanche, erreur: string) {
  await majPlanche(e.empreinte, { statut: "echec", erreur: erreur.slice(0, 500) });
  const x = contexte(e);
  await sendInternal({ ...emailInterneEchec(c, x, erreur), replyTo: c.email }).catch((err) =>
    console.error("[planche] alerte d'échec non envoyée", err),
  );
  await sendToClient({ to: c.email, ...emailClientEchec(c, x) }).catch((err) =>
    console.error("[planche] e-mail d'attente non envoyé", err),
  );
}

export async function POST(req: Request) {
  const secret = secretPlanche();
  const q = new URL(req.url).searchParams;
  const p = { id: q.get("id") ?? "", empreinte: q.get("e") ?? "", expire: Number(q.get("x")), signature: q.get("s") ?? "" };
  if (!secret || !verifierRappel(p, secret)) return NextResponse.json({ ok: false }, { status: 403 });

  const e = await lirePlanche(p.empreinte);
  if (!e || e.id !== p.id) return NextResponse.json({ ok: false }, { status: 404 });
  if (e.statut === "livree") return NextResponse.json({ ok: true, deja: true });
  const c = lireContact(e, secret);
  if (!c) return NextResponse.json({ ok: false, error: "contact illisible" }, { status: 500 });

  const type = req.headers.get("content-type") ?? "";
  if (!type.startsWith("application/pdf")) {
    const corps = (await req.json().catch(() => ({}))) as { erreur?: unknown };
    await signalerEchec(e, c, typeof corps.erreur === "string" ? corps.erreur : "Erreur inconnue du générateur");
    return NextResponse.json({ ok: true });
  }

  const pdf = Buffer.from(await req.arrayBuffer());
  if (pdf.length > TAILLE_MAX || pdf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    await signalerEchec(e, c, `PDF reçu invalide (${pdf.length} octets)`);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const x = contexte(e);
  const pieces = [{ filename: nomFichierPlanche(x), content: pdf }];
  try {
    await sendToClient({ to: c.email, ...emailClientPlanche(c, x), attachments: pieces });
  } catch (err) {
    await signalerEchec(e, c, `Envoi au visiteur impossible : ${String(err)}`);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  await majPlanche(e.empreinte, { statut: "livree" });
  await sendInternal({ ...emailInterneLivree(c, x), replyTo: c.email, attachments: pieces }).catch((err) =>
    console.error("[planche] copie interne non envoyée", err),
  );
  return NextResponse.json({ ok: true });
}
