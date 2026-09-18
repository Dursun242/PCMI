import { NextResponse } from "next/server";
import { site, plans } from "@/config/site";
import { steps, labelOf } from "@/config/dossier";
import { rateLimited, ipOf, esc, table, section, attachmentsList, clientWrap, sendPair, collectFiles } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(ip, 4)) return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Formulaire illisible." }, { status: 400 });
  }
  let data: Record<string, string>;
  try {
    data = JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    return NextResponse.json({ ok: false, error: "Données illisibles." }, { status: 400 });
  }
  // nettoyage : chaînes bornées, clés connues uniquement
  const known = new Set(steps.flatMap((s) => s.fields.map((f) => f.id)).concat(["consent"]));
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) if (known.has(k) && typeof v === "string") clean[k] = v.trim().slice(0, k === "message" || k === "description" ? 5000 : 300);

  const email = clean.email ?? "";
  if (!clean.nom || !clean.prenom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !clean.telephone || !clean.terrain_commune) {
    return NextResponse.json({ ok: false, error: "Merci de renseigner au minimum nom, prénom, e-mail, téléphone et commune du terrain." }, { status: 400 });
  }
  if (clean.consent !== "oui") return NextResponse.json({ ok: false, error: "Merci d'accepter le traitement de votre demande." }, { status: 400 });

  const files = await collectFiles(form);
  if (files.error) return NextResponse.json({ ok: false, error: files.error }, { status: 400 });
  const listed = [...files.inline.map((f) => ({ name: f.filename, size: f.content?.length })), ...files.refs];

  const spTotal = Number(clean.sp_existante || 0) + Number(clean.sp_creee || 0) - Number(clean.sp_demolie || 0);
  const over = spTotal > 149;
  const formule = plans.find((p) => p.id === clean.formule)?.name ?? "Conseillez-moi";
  const who = `${clean.prenom} ${clean.nom}`;

  const sections = steps
    .map((s) => {
      const rows: [string, string][] = s.fields
        .filter((f) => clean[f.id])
        .map((f) => [f.label, labelOf(f, clean[f.id]) + (f.unit ? ` ${f.unit}` : "")]);
      return rows.length ? section(`${s.cerfa} — ${s.title}`, table(rows)) : "";
    })
    .join("");

  const internalHtml = `
    <h2 style="font-family:Lato,Arial,sans-serif">Fiche projet PCMI — ${esc(who)} — ${esc(clean.terrain_commune)}</h2>
    <p style="font-family:Lato,Arial,sans-serif;font-size:15px">
      Formule : <strong>${esc(formule)}</strong> · Surface de plancher totale : <strong>${spTotal} m²</strong>
      ${over ? ' · <strong style="color:#a3402c">&gt; 149 m² : hors formules, devis sur mesure (architecte obligatoire au-delà de 150 m²)</strong>' : ""}
    </p>
    ${sections}
    ${listed.length ? section("Documents joints", attachmentsList(listed)) : ""}
    <p style="color:#939b96;font-size:12px;margin-top:24px">Le fichier dossier.json joint contient toutes les réponses, prêt pour l'outil PCMI. IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>`;

  const clientHtml = clientWrap(`
    <p>Bonjour ${esc(clean.prenom)},</p>
    <p>Votre fiche projet pour un permis de construire à <strong>${esc(clean.terrain_commune)}</strong> est bien arrivée${listed.length ? `, avec ${listed.length} document${listed.length > 1 ? "s" : ""}` : ""}.</p>
    ${over
      ? `<p>Votre projet représente environ <strong>${spTotal} m² de surface de plancher</strong>. Au-delà de 149 m², nos formules à prix fixe ne s'appliquent plus : nous préparons un devis sur mesure avec notre architecte partenaire (obligatoire au-delà de 150 m²) et revenons vers vous sous <strong>48 h ouvrées</strong>.</p>`
      : `<p>Nous lisons le règlement d'urbanisme de votre commune et vous adressons sous <strong>48 h ouvrées</strong> un devis à prix fixe, avec la formule conseillée et la liste des éventuels documents manquants.</p>`}
    <p>Si vous avez oublié une pièce, répondez simplement à cet e-mail en la joignant.</p>`);

  const json = { version: 1, receivedAt: new Date().toISOString(), site: site.url, formule: clean.formule ?? "conseil", spTotal, architecteObligatoire: over, reponses: clean, documents: listed };

  try {
    await sendPair({
      subject: `Fiche projet — ${who} — ${clean.terrain_commune} — ${formule}${over ? " — ≥150 m²" : ""}`,
      internalHtml,
      replyTo: email,
      clientSubject: `Votre fiche projet est bien reçue — ${site.name}`,
      clientHtml,
      attachments: [...files.inline, { filename: "dossier.json", content: Buffer.from(JSON.stringify(json, null, 2)) }],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[dossier]", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
