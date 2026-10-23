import { NextResponse } from "next/server";
import { remettreAZero, suiviConfigure } from "@/lib/suiviStore";

export const runtime = "nodejs";

/**
 * Remise à zéro du compteur Express (après des tests, avant de lancer la
 * campagne). Protégée par le middleware /api/admin. Rien n'est effacé :
 * les événements antérieurs restent stockés mais ne sont plus comptés.
 */
export async function POST() {
  if (!suiviConfigure()) {
    return NextResponse.json({ ok: false, error: "Stockage non configuré." }, { status: 501 });
  }
  try {
    const instant = await remettreAZero();
    return NextResponse.json({ ok: true, instant });
  } catch (err) {
    console.error("[suivi] remise à zéro impossible", err);
    return NextResponse.json({ ok: false, error: "Remise à zéro impossible." }, { status: 502 });
  }
}
