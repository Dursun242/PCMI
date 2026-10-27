"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Vitesse du défilement automatique, en pixels par seconde. */
const VITESSE = 30;
/** Après un geste du visiteur (doigt, molette, clavier), reprise au bout de ce délai. */
const PAUSE_APRES_GESTE = 4000;

/**
 * Liste horizontale qui défile seule, lentement et en boucle : les éléments
 * sont recopiés une fois à la suite (copies masquées aux lecteurs d'écran),
 * et l'on revient au début à mi-course sans que cela se voie.
 * Le visiteur garde la main : la liste se fige sous la souris, au doigt ou au
 * clavier, reste glissable, et repart ensuite. Rien ne bouge hors de l'écran,
 * onglet caché ou mouvement réduit demandé.
 */
export default function BandeauDefilant({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ul = ref.current;
    if (!ul || !ul.children.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const copies = Array.from(ul.children, (n) => {
      const c = n.cloneNode(true) as HTMLElement;
      c.setAttribute("aria-hidden", "true");
      c.inert = true;
      return c;
    });
    ul.append(...copies);

    let position = ul.scrollLeft;
    let precedent = 0;
    let visible = false;
    let survol = false;
    let repriseA = 0;
    let image = 0;

    // L'aimantation des photos ramènerait la liste en arrière à chaque pas : coupée pendant le défilement seul.
    const aimanter = (oui: boolean) => {
      ul.style.scrollSnapType = oui ? "" : "none";
    };

    // La boucle ne tourne que pendant que la liste est à l'écran (liste masquée comprise : jamais lancée).
    const pas = (t: number) => {
      if (!visible) {
        image = 0;
        return;
      }
      image = requestAnimationFrame(pas);
      const ecart = precedent ? Math.min(t - precedent, 100) : 0;
      precedent = t;
      if (survol || t < repriseA || document.hidden) {
        position = ul.scrollLeft;
        return;
      }
      aimanter(false);
      position += (VITESSE * ecart) / 1000;
      // Distance exacte entre un élément et sa copie : au-delà, on recule d'autant, sans saut visible.
      const tour = copies[0].offsetLeft - (ul.firstElementChild as HTMLElement).offsetLeft;
      if (tour > 0 && position >= tour) position -= tour;
      ul.scrollLeft = position;
    };

    const geste = () => {
      repriseA = performance.now() + PAUSE_APRES_GESTE;
      aimanter(true);
    };
    const entree = () => {
      survol = true;
    };
    const sortie = () => {
      survol = false;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !image) {
        precedent = 0;
        image = requestAnimationFrame(pas);
      }
    });
    io.observe(ul);

    ul.addEventListener("pointerdown", geste);
    ul.addEventListener("wheel", geste, { passive: true });
    ul.addEventListener("focusin", geste);
    ul.addEventListener("mouseenter", entree);
    ul.addEventListener("mouseleave", sortie);

    return () => {
      cancelAnimationFrame(image);
      io.disconnect();
      ul.removeEventListener("pointerdown", geste);
      ul.removeEventListener("wheel", geste);
      ul.removeEventListener("focusin", geste);
      ul.removeEventListener("mouseenter", entree);
      ul.removeEventListener("mouseleave", sortie);
      copies.forEach((c) => c.remove());
      aimanter(true);
    };
  }, []);

  return (
    <ul ref={ref} className={`bandeau ${className ?? ""}`}>
      {children}
    </ul>
  );
}
