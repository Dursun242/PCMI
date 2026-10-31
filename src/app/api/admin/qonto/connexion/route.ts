import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { COOKIE_ETAT_QONTO, configOAuth, urlAutorisation } from "@/lib/qontoOAuth";

export const runtime = "nodejs";

/** Le temps laissé pour autoriser l'application chez Qonto. */
const DUREE_ETAT_SECONDES = 10 * 60;

/**
 * « Connecter Qonto » (espace admin, protégé par le middleware) : renvoie vers
 * la page d'autorisation Qonto. L'adresse de retour doit être déclarée à
 * l'identique dans l'application du Developer Portal.
 */
export async function GET(req: Request) {
  const cfg = configOAuth();
  const origine = new URL(req.url).origin;
  if (!cfg) return NextResponse.redirect(`${origine}/admin?qonto=non-configure`);

  const etat = randomBytes(32).toString("hex");
  const res = NextResponse.redirect(urlAutorisation(cfg, `${origine}/api/admin/qonto/retour`, etat));
  res.cookies.set(COOKIE_ETAT_QONTO, etat, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/qonto",
    maxAge: DUREE_ETAT_SECONDES,
  });
  return res;
}
