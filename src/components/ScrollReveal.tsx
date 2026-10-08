"use client";

import { useEffect } from "react";

/** Éléments qui apparaissent au défilement (styles dans app/motion.css). */
const CIBLES = "[data-reveal], [data-stagger] > *, main .h-section, main .rule";

/**
 * Fait apparaître les éléments quand ils entrent à l'écran. L'animation se rejoue
 * dans les deux sens : un élément sorti de l'écran se masque, puis réapparaît en
 * venant d'en bas quand on descend, d'en haut quand on remonte.
 * Les contenus ajoutés après coup (navigation, formulaires) sont pris en compte.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const html = document.documentElement;
    // Le script de layout.tsx retire « reveal-on » si ce signal n'arrive pas à temps.
    html.setAttribute("data-reveal-pret", "");
    if (!html.classList.contains("reveal-on")) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.classList.add("is-visible");
          } else {
            el.dataset.sens = e.boundingClientRect.top < 0 ? "haut" : "bas";
            el.classList.remove("is-visible");
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    let image = 0;
    const scan = () => {
      image = 0;
      // observe() ignore un élément déjà suivi : on peut rebalayer sans risque.
      document.querySelectorAll(CIBLES).forEach((el) => io.observe(el));
    };
    const planifier = () => {
      if (!image) image = requestAnimationFrame(scan);
    };
    scan();
    const mo = new MutationObserver(planifier);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(image);
    };
  }, []);

  return null;
}
