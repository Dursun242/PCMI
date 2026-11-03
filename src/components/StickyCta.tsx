"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HUB_PATH, PAGES_PLANCHES } from "@/config/planchesGratuites";
import { trackEvent } from "@/lib/analytics";

/**
 * Ce que la barre propose selon la page :
 * - accueil : public mêlé, le plan gratuit pour qui découvre, la commande pour qui est prêt ;
 * - conseils : lecteurs qui s'informent, accrochés par le plan de masse gratuit ;
 * - pages de vente : la commande seule.
 */
type Barre = "accueil" | "conseils" | "vente";
function barrePour(pathname: string): Barre | null {
  if (pathname === "/") return "accueil";
  if (pathname === "/conseils" || pathname.startsWith("/conseils/")) return "conseils";
  if (pathname === "/tarifs" || pathname === "/permis-de-construire-maison" || pathname === "/permis-de-construire-en-ligne") return "vente";
  return null;
}

/**
 * Barre d'appel à l'action fixée en bas d'écran, mobile uniquement.
 * Absente des pages où l'utilisateur est déjà en train d'agir
 * (/devis, /dossier, /contact) et de tout le reste du site.
 * Elle n'apparaît qu'après un début de lecture, pour ne pas recouvrir le hero,
 * et s'efface quand un bloc [data-masque-barre] est à l'écran (le bloc du plan
 * gratuit de l'accueil propose déjà la même chose).
 */
export default function StickyCta() {
  const pathname = usePathname();
  const barre = barrePour(pathname);
  const [visible, setVisible] = useState(false);
  const [masquee, setMasquee] = useState(false);

  useEffect(() => {
    if (!barre) {
      setVisible(false);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const blocs = document.querySelectorAll("[data-masque-barre]");
    const io = new IntersectionObserver((entries) => setMasquee(entries.some((e) => e.isIntersecting)));
    blocs.forEach((b) => io.observe(b));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      setMasquee(false);
    };
  }, [barre, pathname]);

  if (!barre || !visible) return null;

  return (
    <>
      {/* Réserve la hauteur de la barre pour que le bas de page reste atteignable. */}
      <div className="h-[4.75rem] md:hidden" aria-hidden="true" />
      <div
        inert={masquee}
        className={`barre-cta md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-stone-2 bg-paper/97 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3 transition-transform duration-300 ${
          masquee ? "translate-y-full" : ""
        }`}
      >
        {barre === "accueil" ? (
          <>
            <Link
              href={HUB_PATH}
              className="btn btn-line !min-h-12 flex-1 !px-3"
              onClick={() => trackEvent("cta_click", { source: "sticky_mobile_plan_gratuit" })}
            >
              Plan gratuit
            </Link>
            <Link
              href="/commander"
              className="btn btn-ink !min-h-12 flex-1 !px-3"
              onClick={() => trackEvent("cta_click", { source: "sticky_mobile" })}
            >
              Commander
            </Link>
          </>
        ) : barre === "conseils" ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="display text-lg leading-tight">{PAGES_PLANCHES.masse.court}</p>
              <p className="text-xs text-ink-2 truncate">Votre terrain en PDF A3, par e-mail</p>
            </div>
            <Link
              href={PAGES_PLANCHES.masse.path}
              className="btn btn-ink !min-h-12 shrink-0 !px-5"
              onClick={() => trackEvent("cta_click", { source: "sticky_mobile_plan_gratuit" })}
            >
              Le recevoir
            </Link>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="display text-lg leading-tight">Devis immédiat</p>
              <p className="text-xs text-ink-2 truncate">En 1, 4 ou 10 fois sans frais</p>
            </div>
            <Link
              href="/commander"
              className="btn btn-ink !min-h-12 shrink-0 !px-5"
              onClick={() => trackEvent("cta_click", { source: "sticky_mobile" })}
            >
              Commander
            </Link>
          </>
        )}
      </div>
    </>
  );
}
