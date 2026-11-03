import { NextResponse } from "next/server";
import { emailClientFiche, emailInterneFiche, nomFichierFiche } from "@/lib/emailsFiche";
import { analyserTerrain, apercu, validerDemandeFiche } from "@/lib/ficheTerrain";
import { pdfFicheTerrain } from "@/lib/ficheTerrainPdf";
import { chargerTerrain } from "@/lib/ficheTerrainSources";
import { ipOf, rateLimited, sendInternal, sendToClient } from "@/lib/mailer";
import { estIdu } from "@/lib/planche";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Fiche « Mon terrain est-il constructible ? ».
 * GET  ?idu=… : l'aperçu (zone et voyants), sans inscription.
 * POST        : la fiche complète en PDF, envoyée par e-mail contre prénom, nom, e-mail.
 * Données publiques chargées à la demande : rien n'est stocké, rien ne passe par GitHub.
 */

const indisponible = () =>
  NextResponse.json({ ok: false, error: "Les services publics (IGN, Géorisques) ne répondent pas pour le moment. Réessayez dans un instant." }, { status: 502 });

export async function GET(req: Request) {
  if (rateLimited(`fiche-apercu:${ipOf(req)}`, 40)) {
    return NextResponse.json({ ok: false, error: "Trop de recherches. Réessayez dans quelques minutes." }, { status: 429 });
  }
  const idu = (new URL(req.url).searchParams.get("idu") ?? "").toUpperCase();
  if (!estIdu(idu)) return NextResponse.json({ ok: false, error: "Choisissez une parcelle sur la carte." }, { status: 400 });
  try {
    const d = await chargerTerrain(idu);
    if (!d) return NextResponse.json({ ok: false, error: "Parcelle introuvable au cadastre." }, { status: 404 });
    return NextResponse.json({ ok: true, apercu: apercu(d, analyserTerrain(d)) });
  } catch (err) {
    console.error("[fiche-terrain] aperçu impossible", err);
    return indisponible();
  }
}

export async function POST(req: Request) {
  if (rateLimited(`fiche:${ipOf(req)}`, 6)) {
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

  const v = validerDemandeFiche(corps);
  if ("erreurs" in v) return NextResponse.json({ ok: false, erreurs: v.erreurs }, { status: 400 });
  const demande = v.demande;
  const contact = { prenom: demande.prenom, nom: demande.nom, email: demande.email };

  let d;
  try {
    d = await chargerTerrain(demande.idu, demande.adresse || null);
  } catch (err) {
    console.error("[fiche-terrain] chargement impossible", err);
    return indisponible();
  }
  if (!d) return NextResponse.json({ ok: false, error: "Parcelle introuvable au cadastre." }, { status: 404 });

  const a = analyserTerrain(d);
  const date = new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  let pdf: Buffer;
  try {
    pdf = Buffer.from(await pdfFicheTerrain(d, a, { date, pour: `${contact.prenom} ${contact.nom}` }));
  } catch (err) {
    console.error("[fiche-terrain] PDF impossible", err);
    return NextResponse.json({ ok: false, error: "La fiche n'a pas pu être préparée. Réessayez." }, { status: 500 });
  }
  const pieces = [{ filename: nomFichierFiche(d), content: pdf }];

  try {
    await sendToClient({ to: contact.email, ...emailClientFiche(contact, d, a), attachments: pieces });
  } catch (err) {
    console.error("[fiche-terrain] envoi au visiteur impossible", err);
    return NextResponse.json({ ok: false, error: "L'envoi de la fiche a échoué. Vérifiez votre adresse e-mail et réessayez." }, { status: 502 });
  }
  await sendInternal({ ...emailInterneFiche(contact, d, a, demande.adresse || null), replyTo: contact.email, attachments: pieces }).catch((err) =>
    console.error("[fiche-terrain] copie interne non envoyée", err),
  );
  return NextResponse.json({ ok: true });
}
