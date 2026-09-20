import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { rateLimited, ipOf, esc, table, section, attachmentsList, clientWrap, sendPair, collectFiles } from "@/lib/mailer";

export const runtime = "nodejs";

const subjects: Record<string, string> = { question: "Question sur un permis", devis: "Demande de devis", refus: "Permis refusé ou incomplet", autre: "Autre" };

export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(ip)) return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Formulaire illisible." }, { status: 400 });
  }
  if (form.get("website")) return NextResponse.json({ ok: true });

  const s = (k: string, max = 200) => String(form.get(k) ?? "").trim().slice(0, max);
  const name = s("name", 120);
  const email = s("email");
  const phone = s("phone", 40);
  const city = s("city", 120);
  const subject = subjects[s("subject", 20)] ?? "Message";
  const message = s("message", 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return NextResponse.json({ ok: false, error: "Merci de renseigner nom, e-mail et message." }, { status: 400 });
  }
  if (!form.get("consent")) return NextResponse.json({ ok: false, error: "Merci d'accepter le traitement de votre demande." }, { status: 400 });

  const files = await collectFiles(form);
  if (files.error) return NextResponse.json({ ok: false, error: files.error }, { status: 400 });
  const listed = [...files.inline.map((f) => ({ name: f.filename, size: f.content?.length })), ...files.refs];

  const internalHtml = `
    <h2 style="font-family:Lato,Arial,sans-serif">Contact — ${esc(subject)}</h2>
    ${table([["Nom", name], ["E-mail", email], ["Téléphone", phone], ["Commune", city]])}
    <p style="font-family:Lato,Arial,sans-serif;white-space:pre-wrap;margin-top:16px">${esc(message)}</p>
    ${listed.length ? section("Pièces jointes", attachmentsList(listed)) : ""}
    <p style="color:#939b96;font-size:12px;margin-top:24px">IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>`;

  const clientHtml = clientWrap(`
    <p>Bonjour ${esc(name.split(" ")[0])},</p>
    <p>Votre message est bien arrivé${listed.length ? ` avec ${listed.length} pièce${listed.length > 1 ? "s" : ""} jointe${listed.length > 1 ? "s" : ""}` : ""}. Nous vous répondons sous <strong>4 h ouvrées</strong>.</p>
    <p>Si vous souhaitez gagner du temps, vous pouvez aussi remplir la <a href="${site.url}/dossier">fiche projet complète</a> : elle reprend les informations du CERFA et nous permet de chiffrer votre permis immédiatement.</p>`);

  try {
    await sendPair({
      subject: `Contact — ${name}${city ? ` — ${city}` : ""} — ${subject}`,
      internalHtml,
      replyTo: email,
      clientSubject: `Votre message est bien reçu — ${site.name}`,
      clientHtml,
      attachments: files.inline,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
