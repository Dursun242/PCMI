"use client";

import { useEffect, useState } from "react";
import TelLink from "./TelLink";

/**
 * Barre fixe en bas d'écran sur mobile, propre à /permis-express : appeler ou
 * remplir le formulaire, à portée de pouce. Elle se masque quand le
 * formulaire est à l'écran, pour ne pas le recouvrir.
 */
export default function ExpressBarre() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const form = document.getElementById("devis");
    let formVisible = false;
    const maj = () => setVisible(window.scrollY > 500 && !formVisible);
    const obs = form
      ? new IntersectionObserver(([e]) => {
          formVisible = e.isIntersecting;
          maj();
        })
      : null;
    if (form && obs) obs.observe(form);
    window.addEventListener("scroll", maj, { passive: true });
    maj();
    return () => {
      window.removeEventListener("scroll", maj);
      obs?.disconnect();
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="barre-cta md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-stone-2 bg-paper/97 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-3">
      <TelLink source="express_barre" className="btn btn-line !min-h-12 !px-3">
        Appeler
      </TelLink>
      <a href="#devis" className="btn btn-ink !min-h-12 !px-3">
        Mon devis gratuit
      </a>
    </div>
  );
}
