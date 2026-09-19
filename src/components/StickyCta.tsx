"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/** Pages de contenu : on y rappelle l'appel à l'action. */
function showsOn(pathname: string) {
  if (pathname === "/" || pathname === "/tarifs" || pathname === "/permis-de-construire-maison") return true;
  return pathname === "/conseils" || pathname.startsWith("/conseils/");
}

/**
 * Barre d'appel à l'action fixée en bas d'écran, mobile uniquement.
 * Absente des pages où l'utilisateur est déjà en train d'agir
 * (/devis, /dossier, /contact) et de tout le reste du site.
 * Elle n'apparaît qu'après un début de lecture, pour ne pas recouvrir le hero.
 */
export default function StickyCta() {
  const pathname = usePathname();
  const eligible = showsOn(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [eligible, pathname]);

  if (!eligible || !visible) return null;

  return (
    <>
      {/* Réserve la hauteur de la barre pour que le bas de page reste atteignable. */}
      <div className="h-[4.75rem] md:hidden" aria-hidden="true" />
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-stone-2 bg-paper/97 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="display text-lg leading-tight">Devis gratuit sous 48 h</p>
          <p className="text-xs text-ink-2 truncate">Prix fixe jusqu&apos;à 149 m². Sans engagement.</p>
        </div>
        <Link
          href="/devis"
          className="btn btn-ink !min-h-12 shrink-0 !px-5"
          onClick={() => trackEvent("cta_click", { source: "sticky_mobile" })}
        >
          Mon devis
        </Link>
      </div>
    </>
  );
}
