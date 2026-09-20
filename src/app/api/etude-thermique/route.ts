import { NextResponse } from "next/server";
import { site, thermique } from "@/config/site";
import { rateLimited, ipOf, esc, table, section, attachmentsList, clientWrap, sendPair, collectFiles } from "@/lib/mailer";

export const runtime = "nodejs";

/** Demande de chiffrage d'étude thermique RE2020 (attestation, Bbio, ACV…). */

const etapes: Record<string, string> = {
  "avant-depot": "Prépare son permis, attestation nécessaire",
  "permis-accorde": "Permis accordé, consultation des artisans",
  "fin-travaux": "Fin de travaux, attestation d'achèvement",
  "pcmi-ici": "Permis fait par Permis by ID Maîtrise",
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

  if (String(form.get("website") ?? "")) return NextResponse.json({ ok: true });

  const get = (k: string, max = 300) => String(form.get(k) ?? "").trim().slice(0, max);
  const name = get("name", 120);
  const email = get("email", 200);
  const phone = get("phone", 40);
  const city = get("city", 120);
  const message = get("message", 4000);
  const etape = etapes[get("etape", 40)] ?? etapes["avant-depot"];

  const ids = new Set(form.getAll("prestations").map((v) => String(v)));
  const prestations = thermique.filter((t) => ids.has(t.id));

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !city) {
    return NextResponse.json({ ok: false, error: "Merci de renseigner nom, e-mail, téléphone et commune." }, { status: 400 });
  }
  if (prestations.length === 0) {
    return NextResponse.json({ ok: false, error: "Cochez au moins une prestation." }, { status: 400 });
  }
  if (String(form.get("consent") ?? "") !== "oui") {
    return NextResponse.json({ ok: false, error: "Merci d'accepter le traitement de votre demande." }, { status: 400 });
  }

  const files = await collectFiles(form);
  if (files.error) return NextResponse.json({ ok: false, error: files.error }, { status: 400 });
  const listed = [...files.inline.map((f) => ({ name: f.filename, size: f.content?.length })), ...files.refs];

  const rows: [string, string][] = [
    ["Nom", name],
    ["E-mail", email],
    ["Téléphone", phone],
    ["Commune du terrain", city],
    ["Étape du projet", etape],
    ["Prestations", prestations.map((p) => p.name).join(", ")],
  ];

  const internalHtml = `
    <h2 style="font-family:Lato,Arial,sans-serif">Étude thermique RE2020 — ${esc(name)} — ${esc(city)}</h2>
    ${table(rows)}
    ${listed.length ? section(`Pièce${listed.length > 1 ? "s" : ""} jointe${listed.length > 1 ? "s" : ""}`, attachmentsList(listed)) : ""}
    ${message ? section("Message", `<p style="font-family:Lato,Arial,sans-serif;white-space:pre-wrap">${esc(message)}</p>`) : ""}
    <p style="color:#939b96;font-size:12px;margin-top:24px">IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>`;

  const clientHtml = clientWrap(`
    <p>Bonjour ${esc(name.split(" ")[0])},</p>
    <p>Nous avons bien reçu votre demande d'étude thermique RE2020 pour un projet à <strong>${esc(city)}</strong>.</p>
    <p>Prestations demandées : ${esc(prestations.map((p) => p.name.toLowerCase()).join(", "))}.</p>
    <p>Notre thermicien lit vos plans et vous adresse sous <strong>4 h ouvrées</strong> un devis à prix fixe, avec le délai de chaque pièce.</p>
    <p>Si vous avez d'autres documents — plans, notice, devis de chauffage —, répondez simplement à cet e-mail en les joignant.</p>`);

  try {
    await sendPair({
      subject: `Étude RE2020 — ${name} — ${city}`,
      internalHtml,
      replyTo: email,
      clientSubject: `Votre demande d'étude thermique RE2020 est bien reçue — ${site.name}`,
      clientHtml,
      attachments: files.inline,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[etude-thermique] envoi échoué", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
