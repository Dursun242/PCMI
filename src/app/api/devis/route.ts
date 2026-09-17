import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site, plans } from "@/config/site";

export const runtime = "nodejs";

/* Limitation de débit très simple, en mémoire (suffisante sur Vercel pour filtrer les rafales) */
const hits = new Map<string, { n: number; t: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 10 * 60_000) {
    hits.set(ip, { n: 1, t: now });
    return false;
  }
  h.n += 1;
  return h.n > 5;
}

const labels: Record<string, Record<string, string>> = {
  projectType: {
    "maison-neuve": "Maison neuve",
    extension: "Extension ou surélévation",
    "garage-annexe": "Garage, annexe, abri",
    autre: "Autre projet",
  },
  stage: {
    idee: "Une idée, pas encore de plans",
    terrain: "Un terrain et un croquis",
    plans: "Des plans existants",
    refus: "Permis refusé ou incomplet",
  },
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Formulaire illisible." }, { status: 400 });
  }

  // Pot de miel : un robot le remplit, un humain ne le voit pas.
  if (body.website) return NextResponse.json({ ok: true });

  const name = (body.name ?? "").trim().slice(0, 120);
  const email = (body.email ?? "").trim().slice(0, 200);
  const phone = (body.phone ?? "").trim().slice(0, 40);
  const city = (body.city ?? "").trim().slice(0, 120);
  const surface = (body.surface ?? "").trim().slice(0, 10);
  const message = (body.message ?? "").trim().slice(0, 4000);
  const projectType = labels.projectType[body.projectType] ?? "Non précisé";
  const stage = labels.stage[body.stage] ?? "Non précisé";
  const plan = plans.find((p) => p.id === body.plan)?.name ?? "Conseillez-moi";

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !city) {
    return NextResponse.json({ ok: false, error: "Merci de renseigner nom, e-mail, téléphone et commune." }, { status: 400 });
  }
  if (!body.consent) {
    return NextResponse.json({ ok: false, error: "Merci d'accepter le traitement de votre demande." }, { status: 400 });
  }

  const surfaceNum = Number(surface);
  const architectFlag = surfaceNum > 149 ? " ⚠️ ≥ 150 m² : hors formules, sur devis avec architecte" : "";

  const rows: [string, string][] = [
    ["Nom", name],
    ["E-mail", email],
    ["Téléphone", phone],
    ["Commune du terrain", city],
    ["Type de projet", projectType],
    ["Surface de plancher", surface ? `${surface} m²${architectFlag}` : "Non précisée"],
    ["Stade", stage],
    ["Formule envisagée", plan],
  ];

  const internalHtml = `
    <h2 style="font-family:Lato,Arial,sans-serif">Nouvelle demande de devis — ${esc(site.name)}</h2>
    <table style="border-collapse:collapse;font-family:Lato,Arial,sans-serif;font-size:15px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#4a5a72">${esc(k)}</td><td style="padding:6px 0;font-weight:700">${esc(v)}</td></tr>`,
        )
        .join("")}
    </table>
    ${message ? `<p style="font-family:Lato,Arial,sans-serif;white-space:pre-wrap;margin-top:16px">${esc(message)}</p>` : ""}
    <p style="color:#8593a8;font-size:12px;margin-top:24px">IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
  `;

  const clientHtml = `
    <div style="font-family:Lato,Arial,sans-serif;font-size:16px;line-height:1.6;color:#10233f;max-width:560px">
      <p>Bonjour ${esc(name.split(" ")[0])},</p>
      <p>Nous avons bien reçu votre demande de devis pour un permis de construire à <strong>${esc(city)}</strong>.</p>
      <p>Nous consultons le règlement d'urbanisme de votre commune et vous répondons sous <strong>48 h ouvrées</strong> avec un prix fixe, la formule conseillée et la liste des documents utiles.</p>
      <p>Si vous avez déjà des plans, une esquisse ou des photos du terrain, vous pouvez simplement répondre à cet e-mail en les joignant.</p>
      <p>À très vite,<br><strong>${esc(site.legal.director)}</strong><br>${esc(site.parent)} — maître d'œuvre<br>${esc(site.address.street)}, ${esc(site.address.zip)} ${esc(site.address.city)}</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? `${site.name} <contact@id-maitrise.com>`;
  const to = process.env.MAIL_TO ?? site.email;

  if (!apiKey) {
    console.warn("[devis] RESEND_API_KEY absente : demande non envoyée (mode développement).", rows);
    return NextResponse.json({ ok: true, dev: true });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Devis permis — ${name} — ${city} — ${plan}`,
      html: internalHtml,
    });
    await resend.emails.send({
      from,
      to: email,
      replyTo: to,
      subject: `Votre demande de devis est bien reçue — ${site.name}`,
      html: clientHtml,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[devis] envoi Resend échoué", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
