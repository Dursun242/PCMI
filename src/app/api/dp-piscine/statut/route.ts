import { NextResponse } from "next/server";
import { enCache } from "@/lib/cacheMemoire";
import { causePanne } from "@/lib/dpPiscine";
import { dossierDuClient, envoyer, lireContact, suiviDuClient, verifierPaiement, vueClient } from "@/lib/dpPiscineServeur";
import { majDp } from "@/lib/dpPiscineStore";
import { emailInterne } from "@/lib/emailsDpPiscine";
import { sendInternal } from "@/lib/mailer";
import { estimationWorkflow } from "@/lib/plancheGithub";
import { ipOf, rateLimited } from "@/lib/mailer";

export const runtime = "nodejs";

/** État du dossier pour la page de suivi (interrogée toutes les quelques secondes). */
export async function GET(req: Request) {
  if (rateLimited(`dp-statut:${ipOf(req)}`, 120)) return NextResponse.json({ ok: false }, { status: 429 });
  const q = new URL(req.url).searchParams;
  const d = await dossierDuClient(q.get("id") ?? "", q.get("k") ?? "");
  if (!d) return NextResponse.json({ ok: false, error: "Dossier introuvable : ouvrez le lien reçu par e-mail." }, { status: 404 });
  let e = await verifierPaiement(d.e, d.secret);
  // compte à rebours : où en est le dessin chez GitHub (gardé 20 s, pour ne pas interroger GitHub à chaque visite)
  const estimation =
    q.get("estimer") === "1" && e.statut === "en_cours"
      ? await enCache(`dp-run:${e.id}`, () => estimationWorkflow("dp-piscine.yml", e.cree), 20_000).catch(() => null)
      : null;
  // dessin interrompu chez GitHub ou sans réponse : le client ne doit jamais attendre sans fin, ID Maîtrise est prévenu
  const panne = e.statut === "en_cours" ? causePanne(e.cree, estimation) : null;
  if (panne) {
    const maj = await majDp(e.id, d.secret, "erreur", { statut: "echec", erreur: panne });
    const c = lireContact(e, d.secret);
    if (maj && c) {
      await enCache(`dp-panne:${e.id}`, () =>
        envoyer("alerte de panne", () => sendInternal({ ...emailInterne("Dessin interrompu", c, maj, suiviDuClient(maj, d.secret), panne), replyTo: c.email })).then(() => true),
        3_600_000,
      );
    }
    e = maj ?? { ...e, statut: "echec", erreur: panne };
  }
  return NextResponse.json({ ok: true, ...vueClient(e), admin: d.admin, estimation: panne ? null : estimation });
}
