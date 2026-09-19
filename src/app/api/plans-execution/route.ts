import { NextResponse } from "next/server";
import { site, exePacks, exePlans } from "@/config/site";
import { rateLimited, ipOf, esc, table, section, attachmentsList, clientWrap, sendPair, collectFiles } from "@/lib/mailer";

export const runtime = "nodejs";

/**
 * Demande de chiffrage de plans d'exécution (structure, charpente, réseaux…).
 *
 * Le client coche des lots ou un pack, dit où en est son permis et joint,
 * s'il les a, ses plans PCMI. Les pièces jointes sont facultatives : un
 * permis fait chez nous n'a rien à renvoyer.
 */

const etats: Record<string, string> = {
  accorde: "Permis accordé",
  depose: "Permis déposé, en cours d'instruction",
  "pcmi-ici": "Permis fait par Permis by ID Maîtrise",
  "pas-encore": "Pas encore de permis",
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
  const etat = etats[get("etat", 40)] ?? etats.accorde;

  const pack = exePacks.find((p) => p.id === get("pack", 40));
  // Seuls les identifiants connus sont retenus : le reste est ignoré sans bruit.
  const lotIds = new Set(
    form
      .getAll("lots")
      .map((v) => String(v))
      .filter((v) => exePlans.some((p) => p.id === v)),
  );
  pack?.includes.forEach((id) => lotIds.add(id));
  const lots = exePlans.filter((p) => lotIds.has(p.id));

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !city) {
    return NextResponse.json({ ok: false, error: "Merci de renseigner nom, e-mail, téléphone et commune." }, { status: 400 });
  }
  if (lots.length === 0) {
    return NextResponse.json({ ok: false, error: "Cochez au moins un plan, ou choisissez un pack." }, { status: 400 });
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
    ["Commune du chantier", city],
    ["État du permis", etat],
    ["Pack", pack ? pack.name : "À la carte"],
    ["Plans demandés", lots.map((l) => l.name).join(", ")],
  ];

  const internalHtml = `
    <h2 style="font-family:Lato,Arial,sans-serif">Plans EXE — ${esc(name)} — ${esc(city)}</h2>
    ${table(rows)}
    ${listed.length ? section(`Pièce${listed.length > 1 ? "s" : ""} jointe${listed.length > 1 ? "s" : ""}`, attachmentsList(listed)) : ""}
    ${message ? section("Message", `<p style="font-family:Lato,Arial,sans-serif;white-space:pre-wrap">${esc(message)}</p>`) : ""}
    <p style="color:#939b96;font-size:12px;margin-top:24px">IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>`;

  const clientHtml = clientWrap(`
    <p>Bonjour ${esc(name.split(" ")[0])},</p>
    <p>Nous avons bien reçu votre demande de plans d'exécution pour votre chantier à <strong>${esc(city)}</strong>${pack ? ` (${esc(pack.name)})` : ""}.</p>
    <p>Plans demandés : ${esc(lots.map((l) => l.name.toLowerCase()).join(", "))}.</p>
    <p>Nous lisons votre dossier de permis et vous adressons sous <strong>48 h ouvrées</strong> un devis à prix fixe, lot par lot, avec le délai de livraison de chaque plan.</p>
    <p>Si vous avez d'autres documents — rapport de sol, plans du constructeur, devis d'artisans —, répondez simplement à cet e-mail en les joignant.</p>`);

  try {
    await sendPair({
      subject: `Plans EXE — ${name} — ${city}`,
      internalHtml,
      replyTo: email,
      clientSubject: `Votre demande de plans d'exécution est bien reçue — ${site.name}`,
      clientHtml,
      attachments: files.inline,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[plans-execution] envoi échoué", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
