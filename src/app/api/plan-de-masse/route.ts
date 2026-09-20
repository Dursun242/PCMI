import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { rateLimited, ipOf, esc, table, section, attachmentsList, clientWrap, sendPair, collectFiles } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Envoi d'un plan de masse existant (PDF, DWG, DXF, image) pour chiffrage.
 *
 * Formulaire court : on ne demande que ce qui permet de rappeler la personne
 * et de lire le bon règlement d'urbanisme. Tout le reste est dans le fichier.
 */

const besoins: Record<string, string> = {
  chiffrer: "Chiffrer le dossier de permis complet",
  conformite: "Vérifier la conformité au PLU",
  reprendre: "Reprendre ou corriger ce plan",
  autre: "Autre demande",
};

export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(ip, 5)) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Formulaire illisible." }, { status: 400 });
  }

  // Pot de miel : un robot le remplit, un humain ne le voit pas.
  if (String(form.get("website") ?? "")) return NextResponse.json({ ok: true });

  const get = (k: string, max = 300) => String(form.get(k) ?? "").trim().slice(0, max);
  const name = get("name", 120);
  const email = get("email", 200);
  const phone = get("phone", 40);
  const city = get("city", 120);
  const message = get("message", 4000);
  const besoin = besoins[get("besoin", 40)] ?? besoins.chiffrer;

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !city) {
    return NextResponse.json({ ok: false, error: "Merci de renseigner nom, e-mail, téléphone et commune." }, { status: 400 });
  }
  if (String(form.get("consent") ?? "") !== "oui") {
    return NextResponse.json({ ok: false, error: "Merci d'accepter le traitement de votre demande." }, { status: 400 });
  }

  const files = await collectFiles(form);
  if (files.error) return NextResponse.json({ ok: false, error: files.error }, { status: 400 });

  const listed = [...files.inline.map((f) => ({ name: f.filename, size: f.content?.length })), ...files.refs];
  if (listed.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Joignez votre plan de masse : c'est lui que nous analysons." },
      { status: 400 },
    );
  }

  const rows: [string, string][] = [
    ["Nom", name],
    ["E-mail", email],
    ["Téléphone", phone],
    ["Commune du terrain", city],
    ["Besoin", besoin],
  ];

  const internalHtml = `
    <h2 style="font-family:Lato,Arial,sans-serif">Plan de masse reçu — ${esc(name)} — ${esc(city)}</h2>
    ${table(rows)}
    ${section(`Plan${listed.length > 1 ? "s" : ""} joint${listed.length > 1 ? "s" : ""}`, attachmentsList(listed))}
    ${message ? section("Message", `<p style="font-family:Lato,Arial,sans-serif;white-space:pre-wrap">${esc(message)}</p>`) : ""}
    <p style="color:#939b96;font-size:12px;margin-top:24px">IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>`;

  const clientHtml = clientWrap(`
    <p>Bonjour ${esc(name.split(" ")[0])},</p>
    <p>Nous avons bien reçu votre plan de masse pour un terrain à <strong>${esc(city)}</strong>${listed.length > 1 ? ` (${listed.length} fichiers)` : ""}.</p>
    <p>Nous le confrontons au règlement d'urbanisme de votre commune et vous répondons sous <strong>4 h ouvrées</strong> : ce que le plan permet déjà, ce qui manque au regard des exigences de la pièce PCMI 2, et le prix pour aller jusqu'au dépôt.</p>
    <p>Si vous avez d'autres documents — plan du géomètre, extrait cadastral, photos du terrain —, répondez simplement à cet e-mail en les joignant.</p>`);

  try {
    await sendPair({
      subject: `Plan de masse — ${name} — ${city}`,
      internalHtml,
      replyTo: email,
      clientSubject: `Votre plan de masse est bien reçu — ${site.name}`,
      clientHtml,
      attachments: files.inline,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[plan-de-masse] envoi échoué", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
