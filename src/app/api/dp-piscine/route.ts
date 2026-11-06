import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { ficheWorkflow, validerDemandeDp } from "@/lib/dpPiscine";
import { envoyer, secretDp } from "@/lib/dpPiscineServeur";
import { ecrireDp, empreinteJeton, majDp, nouveauJeton, type EntreeDp } from "@/lib/dpPiscineStore";
import { emailClientDemarre, emailInterne, lienSuivi, type ContactDp } from "@/lib/emailsDpPiscine";
import { ipOf, rateLimited, sendInternal, sendToClient } from "@/lib/mailer";
import { referenceCourte } from "@/lib/planche";
import { declencherWorkflow } from "@/lib/plancheGithub";
import { chiffrer, signerRappel } from "@/lib/plancheSecret";

export const runtime = "nodejs";

/** Le workflow attend parfois son tour chez GitHub : l'adresse de rappel vaut 3 heures. */
const VALIDITE_RAPPEL_MS = 3 * 60 * 60 * 1000;

/**
 * Nouvelle DP piscine : la fiche du client est enregistrée, puis dessinée par
 * l'outil d'ID Maîtrise (workflow « DP piscine (site) » d'id-plans), qui
 * renvoie l'aperçu, le dossier et le Cerfa à /api/dp-piscine/livraison. Le
 * client suit son dossier sur /dp-piscine/suivi (lien gardé aussi par e-mail).
 */
export async function POST(req: Request) {
  if (rateLimited(`dp-piscine:${ipOf(req)}`, 6)) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }
  let corps: Record<string, unknown>;
  try {
    corps = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Demande illisible." }, { status: 400 });
  }
  if (typeof corps.site_web === "string" && corps.site_web) return NextResponse.json({ ok: true });
  const v = validerDemandeDp(corps);
  if ("erreurs" in v) return NextResponse.json({ ok: false, erreurs: v.erreurs }, { status: 400 });
  const d = v.demande;
  const secret = secretDp();
  if (!secret) {
    console.error("[dp-piscine] PLANCHE_SECRET (ou ADMIN_SESSION_SECRET) absent");
    return NextResponse.json({ ok: false, error: "Service momentanément indisponible." }, { status: 503 });
  }

  const id = crypto.randomUUID();
  const k = nouveauJeton();
  const contact: ContactDp = { prenom: d.prenom, nom: d.nom, email: d.email, telephone: d.telephone };
  const maintenant = Date.now();
  const e: EntreeDp = {
    id,
    jeton: empreinteJeton(k),
    jetonChiffre: chiffrer(k, secret),
    cree: maintenant,
    maj: maintenant,
    statut: "en_cours",
    commune: d.commune,
    reference: d.idus.map(referenceCourte).join(", "),
    contact: chiffrer(JSON.stringify(contact), secret),
  };
  try {
    await ecrireDp(e, secret);
  } catch (err) {
    console.error("[dp-piscine] dossier non enregistré", err);
    return NextResponse.json({ ok: false, error: "Le dossier n'a pas pu être enregistré. Réessayez." }, { status: 502 });
  }

  const expire = maintenant + VALIDITE_RAPPEL_MS;
  const rappel = new URL("/api/dp-piscine/livraison", process.env.PLANCHE_RAPPEL_BASE || site.url);
  rappel.search = new URLSearchParams({ id, e: "dp", x: String(expire), s: signerRappel(id, "dp", expire, secret) }).toString();
  const suivi = lienSuivi(id, k);
  let cause: string | null = null;
  try {
    const fiche = Buffer.from(JSON.stringify(ficheWorkflow(d)), "utf8").toString("base64");
    if (!(await declencherWorkflow("dp-piscine.yml", { fiche, rappel: rappel.toString() }))) {
      cause = "IDPLANS_GITHUB_TOKEN absente : dossier non lancé.";
    }
  } catch (err) {
    cause = `Lancement du workflow impossible : ${err instanceof Error ? err.message : String(err)}`;
  }
  const maj = cause ? ((await majDp(id, secret, { statut: "echec", erreur: cause.slice(0, 300) })) ?? e) : e;
  await envoyer("accusé au client", () => sendToClient({ to: d.email, ...emailClientDemarre(contact, e, suivi) }));
  await envoyer("alerte interne", () =>
    sendInternal({ ...emailInterne(cause ? "Lancement en échec" : "Nouveau dossier", contact, maj, suivi, cause ?? ""), replyTo: d.email }),
  );
  return NextResponse.json({ ok: true, id, k });
}
