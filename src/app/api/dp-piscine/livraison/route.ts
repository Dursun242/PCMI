import { NextResponse } from "next/server";
import { envoyer, lireContact, secretDp, suiviDuClient } from "@/lib/dpPiscineServeur";
import { ecrireFacette, lireDp, majDp, rangerFichier, type ResumeDp, type StatutDp } from "@/lib/dpPiscineStore";
import { emailClientPret, emailClientVerification, emailInterne } from "@/lib/emailsDpPiscine";
import { sendInternal, sendToClient } from "@/lib/mailer";
import { verifierRappel } from "@/lib/plancheSecret";

export const runtime = "nodejs";

/** Limite d'une requête vers une fonction Vercel (4,5 Mo), avec une marge. */
const TAILLE_MAX = 4_400_000;
const STATUTS: StatutDp[] = ["pret", "a_verifier", "bloque", "hors_dp"];

interface ResultatOutil {
  statut?: string;
  regime?: { motif?: string };
  pieces?: string[];
  echecs?: string[];
  a_verifier?: string[];
  taxe?: { base: number; total: number; taux_communal: number; taux_dep: number };
  delai_instruction?: string;
  implantation?: { distances?: number[]; arase_ngf?: number };
  apercus?: string[];
  guide?: string;
  controles?: string;
}

const nettoyer = (l: string) => l.replace(/^[✔✘⚠]\s*/, "").replace(/^\[[^\]]+\]\s*/, "").slice(0, 300);

/**
 * Retour du workflow « DP piscine (site) » d'id-plans, en trois envois signés :
 * ?part=resultat (JSON : statut, contrôles, aperçus), ?part=dossier (PDF),
 * ?part=cerfa (PDF) ; ?part=erreur si l'outil a échoué.
 */
export async function POST(req: Request) {
  const secret = secretDp();
  const q = new URL(req.url).searchParams;
  const id = q.get("id") ?? "";
  const p = { id, empreinte: q.get("e") ?? "", expire: Number(q.get("x")), signature: q.get("s") ?? "" };
  if (!secret || p.empreinte !== "dp" || !verifierRappel(p, secret)) return NextResponse.json({ ok: false }, { status: 403 });
  const e = await lireDp(id, secret);
  if (!e) return NextResponse.json({ ok: false }, { status: 404 });
  const c = lireContact(e, secret);
  const suiviAdmin = suiviDuClient(e, secret);
  const part = q.get("part");

  if (part === "erreur" || part === "resultat") {
    const r = (await req.json().catch(() => ({}))) as ResultatOutil & { erreur?: string };
    if (part === "erreur") {
      const maj = await majDp(id, secret, "erreur", { statut: "echec", erreur: String(r.erreur ?? "erreur inconnue").slice(0, 500) });
      if (c && maj) await envoyer("alerte d'échec", () => sendInternal({ ...emailInterne("ÉCHEC de l'outil", c, maj, suiviAdmin, String(r.erreur ?? "")), replyTo: c.email }));
      return NextResponse.json({ ok: true });
    }
    const statut = STATUTS.includes(r.statut as StatutDp) ? (r.statut as StatutDp) : "bloque";
    const apercus: string[] = [];
    for (const [i, b64] of (r.apercus ?? []).slice(0, 4).entries()) {
      const img = Buffer.from(b64, "base64");
      if (img.subarray(0, 2).toString("hex") === "ffd8") apercus.push(await rangerFichier(id, secret, `apercu-${i + 1}.jpg`, img, "image/jpeg"));
    }
    const resume: ResumeDp = {
      statut,
      motifRegime: String(r.regime?.motif ?? ""),
      pieces: (r.pieces ?? []).map(String).slice(0, 12),
      echecs: (r.echecs ?? []).map(nettoyer).slice(0, 20),
      aVerifier: (r.a_verifier ?? []).map(nettoyer).slice(0, 20),
      taxe: r.taxe ? { base: r.taxe.base, total: r.taxe.total, tauxCommunal: r.taxe.taux_communal, tauxDep: r.taxe.taux_dep } : null,
      delai: String(r.delai_instruction ?? "1 mois"),
      distances: (r.implantation?.distances ?? []).map(Number).slice(0, 4),
      arase: typeof r.implantation?.arase_ngf === "number" ? r.implantation.arase_ngf : null,
    };
    const maj = await majDp(id, secret, "resultat", { statut, resume, apercus, guide: String(r.guide ?? "").slice(0, 8000) });
    if (c && maj) {
      const suivi = suiviDuClient(maj, secret);
      if (statut === "pret" || statut === "a_verifier") {
        await envoyer("e-mail « aperçu prêt »", () => sendToClient({ to: c.email, ...emailClientPret(c, maj, suiviDuClient(maj, secret)) }));
      } else if (statut === "bloque") {
        await envoyer("e-mail « vérification »", () => sendToClient({ to: c.email, ...emailClientVerification(c, maj, resume.echecs, suiviDuClient(maj, secret)) }));
      }
      await envoyer("copie interne", () =>
        sendInternal({ ...emailInterne(`Dossier ${statut}`, c, maj, suivi, String(r.controles ?? "").slice(0, 6000)), replyTo: c.email }),
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (part === "dossier" || part === "cerfa") {
    const pdf = Buffer.from(await req.arrayBuffer());
    if (pdf.length > TAILLE_MAX || pdf.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return NextResponse.json({ ok: false, error: "PDF invalide" }, { status: 400 });
    }
    const nom = part === "dossier" ? "DP_piscine_plans.pdf" : "DP_piscine_Cerfa13703.pdf";
    const url = await rangerFichier(id, secret, nom, pdf, "application/pdf");
    await ecrireFacette(id, secret, part === "dossier" ? "fichier-dossier" : "fichier-cerfa", { fichiers: { [part]: url } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: "part inconnue" }, { status: 400 });
}
