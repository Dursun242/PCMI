import { NextResponse } from "next/server";
import { express, site } from "@/config/site";
import { esc, ipOf, rateLimited, sendPair } from "@/lib/mailer";
import { formatEuro } from "@/lib/format";
import { appareilDeLAdmin } from "@/lib/adminAuth";
import { enregistrer } from "@/lib/suiviStore";
import {
  ECHEANCES,
  RENDEZ_VOUS,
  SITUATIONS_TERRAIN,
  TYPES_MAISON,
  estUrgente,
  verdictExpress,
  libelle,
  lireDemande,
  type DemandeExpress,
} from "@/lib/express";

export const runtime = "nodejs";

const MAX_PAR_FENETRE = 5;

const VERDICTS = {
  eligible: `Éligible (${formatEuro(express.prixTTC)} TTC)`,
  hors: "Hors critères : orienter vers une autre formule",
  "a-verifier": "À vérifier au rappel (surface de plancher non précisée)",
};

/** Lignes de l'e-mail interne ; celles que le formulaire court ne demande plus disparaissent quand elles sont vides. */
function lignes(d: DemandeExpress): [string, string][] {
  const facultatives: [string, string][] = [
    ["E-mail", d.email],
    ["Maison", d.typeMaison && libelle(TYPES_MAISON, d.typeMaison)],
    ["Surface de plancher", d.surface ? `${d.surface} m²` : ""],
    ["Terrain", d.terrain && libelle(SITUATIONS_TERRAIN, d.terrain)],
    ["Dépôt souhaité", d.echeance && libelle(ECHEANCES, d.echeance)],
    ["Rendez-vous", d.rendezVous && libelle(RENDEZ_VOUS, d.rendezVous)],
  ];
  return [
    ["Nom", d.name],
    ["Téléphone", d.phone],
    ["Commune du terrain", d.city],
    ...facultatives.filter(([, v]) => v),
    ["Formule Express", VERDICTS[verdictExpress(d)]],
    // Pour importer la conversion dans Google Ads (Outils › Conversions › Importer).
    ["Clic Google Ads (gclid)", d.gclid || "Aucun (visite hors annonce)"],
  ];
}

function mailInterne(d: DemandeExpress, ip: string) {
  const urgente = estUrgente(d);
  return `
    ${urgente ? `<p style="font-family:Lato,Arial,sans-serif;background:#a3402c;color:#fff;padding:10px 14px;font-weight:700">À rappeler en priorité : ${esc(libelle(ECHEANCES, d.echeance))} · ${esc(libelle(SITUATIONS_TERRAIN, d.terrain))}</p>` : ""}
    <h2 style="font-family:Lato,Arial,sans-serif">Demande Express — page Google Ads</h2>
    <table style="border-collapse:collapse;font-family:Lato,Arial,sans-serif;font-size:15px">
      ${lignes(d)
        .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#4a5a72">${esc(k)}</td><td style="padding:6px 0;font-weight:700">${esc(v)}</td></tr>`)
        .join("")}
    </table>
    ${d.message ? `<p style="font-family:Lato,Arial,sans-serif;white-space:pre-wrap;margin-top:16px">${esc(d.message)}</p>` : ""}
    <p style="color:#8593a8;font-size:12px;margin-top:24px">IP ${esc(ip)} · ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</p>
  `;
}

function mailClient(d: DemandeExpress) {
  const bureau = d.rendezVous === "bureau";
  return `
    <div style="font-family:Lato,Arial,sans-serif;font-size:16px;line-height:1.6;color:#10233f;max-width:560px">
      <p>Bonjour ${esc(d.name.split(" ")[0])},</p>
      <p>Votre demande de permis de construire à <strong>${esc(d.city)}</strong> est bien reçue.</p>
      <p>Nous lisons le règlement d'urbanisme de votre commune et vous rappelons <strong>${express.rappel.delai}</strong> (${express.rappel.horaires} ; ${express.rappel.sinon}) au ${esc(d.phone)} avec un prix fixe.${bureau ? " Nous conviendrons ensemble d'un rendez-vous au bureau." : ""}</p>
      <p>Pour gagner du temps, répondez à cet e-mail en joignant ce que vous avez déjà : plan du terrain ou de bornage, croquis ou plan de la maison, photos du terrain.</p>
      <p>À très vite,<br><strong>${esc(site.legal.director)}</strong><br>${esc(site.parent)} — maître d'œuvre<br>${esc(site.address.street)}, ${esc(site.address.zip)} ${esc(site.address.city)}<br>${esc(site.phone)}</p>
    </div>
  `;
}

export async function POST(req: Request) {
  const ip = ipOf(req);
  if (rateLimited(`express:${ip}`, MAX_PAR_FENETRE)) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Formulaire illisible." }, { status: 400 });
  }

  // Pot de miel : un robot le remplit, un humain ne le voit pas.
  if (body.website) return NextResponse.json({ ok: true });

  const lecture = lireDemande(body);
  if (!lecture.ok) return NextResponse.json({ ok: false, error: lecture.error }, { status: 400 });
  const d = lecture.demande;

  try {
    const { dev } = await sendPair({
      subject: `${estUrgente(d) ? "URGENT · " : ""}Express — ${d.name} — ${d.city}`,
      internalHtml: mailInterne(d, ip),
      // Sans e-mail, la réponse au message interne n'irait nulle part : on la renvoie vers nous.
      replyTo: d.email || site.email,
      clientSubject: `Votre demande de permis est bien reçue — ${site.name}`,
      clientHtml: mailClient(d),
    });
    // Une demande d'essai envoyée depuis l'appareil de l'administrateur part par e-mail, sans entrer au compteur.
    if (!(await appareilDeLAdmin(req.headers.get("cookie")))) {
      await enregistrer(estUrgente(d) ? "demande-urgente" : "demande", d.gclid ? "ads" : "direct");
    }
    return NextResponse.json(dev ? { ok: true, dev: true } : { ok: true });
  } catch (err) {
    console.error("[express] envoi Resend échoué", err);
    return NextResponse.json({ ok: false, error: "L'envoi a échoué." }, { status: 502 });
  }
}
