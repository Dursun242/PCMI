import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { stockageJetons } from "@/lib/qontoConnexion";
import { COOKIE_ETAT_QONTO, configOAuth, echangerCode } from "@/lib/qontoOAuth";

export const runtime = "nodejs";

const memeEtat = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Retour de Qonto après l'autorisation : échange du code contre les jetons, enregistrés chiffrés. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const vers = (etat: string) => {
    const res = NextResponse.redirect(`${url.origin}/admin?qonto=${etat}`);
    res.cookies.set(COOKIE_ETAT_QONTO, "", { path: "/api/admin/qonto", maxAge: 0 });
    return res;
  };

  const cfg = configOAuth();
  if (!cfg) return vers("non-configure");
  if (url.searchParams.get("error")) return vers("refuse");

  const code = url.searchParams.get("code");
  const etat = url.searchParams.get("state") ?? "";
  const attendu = (await cookies()).get(COOKIE_ETAT_QONTO)?.value ?? "";
  if (!code || !attendu || !memeEtat(etat, attendu)) return vers("erreur");

  try {
    const jetons = await echangerCode(cfg, code, `${url.origin}/api/admin/qonto/retour`);
    await stockageJetons(cfg.clientSecret).ecrire(jetons);
    return vers("connecte");
  } catch (err) {
    console.error("[qonto] connexion OAuth échouée", err);
    return vers("erreur");
  }
}
