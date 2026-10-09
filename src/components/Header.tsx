"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ETAT_INITIAL, suivreDefilement } from "@/lib/defilement";
import Logo from "./Logo";
import TrackedLink from "./TrackedLink";

const nav = [
  { href: "/tarifs", label: "Permis de construire" },
  { href: "/plans-execution", label: "Plans EXE" },
  { href: "/etude-thermique-re2020", label: "Étude RE2020" },
  { href: "/permis-de-construire-maison", label: "Le guide" },
  { href: "/conseils", label: "Conseils" },
  { href: "/references-chantiers", label: "Réalisations" },
  { href: "/contact", label: "Contact" },
];

/**
 * En-tête : il se compacte dès qu'on a quitté le haut de page, s'efface quand
 * on descend et revient quand on remonte. Les styles lisent data-loin et
 * data-defile posés sur <html> (app/motion.css, section « En-tête »).
 */
export default function Header() {
  const [open, setOpen] = useState(false);

  // Échap ferme le menu mobile, comme tout menu déroulant.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Menu mobile ouvert : la page derrière ne défile plus.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const html = document.documentElement;
    let etat = ETAT_INITIAL;
    let image = 0;
    const maj = () => {
      image = 0;
      const y = Math.max(0, window.scrollY);
      etat = suivreDefilement(etat, y, html.scrollHeight - window.innerHeight);
      html.toggleAttribute("data-loin", y > 8);
      if (etat.actif) html.dataset.defile = etat.sens;
      else html.removeAttribute("data-defile");
    };
    const onScroll = () => {
      if (!image) image = requestAnimationFrame(maj);
    };
    maj();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(image);
      html.removeAttribute("data-loin");
      html.removeAttribute("data-defile");
    };
  }, []);

  const fermer = () => setOpen(false);

  return (
    <>
      <header className="entete sticky top-0 z-40 bg-paper/92 backdrop-blur border-b border-stone-2">
        <div className="entete-ligne mx-auto max-w-7xl px-5 sm:px-8 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Accueil" className="entete-logo entete-logo-entree">
            <Logo priority compact />
          </Link>

          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-5 xl:gap-7 text-[0.92rem] whitespace-nowrap">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-bronze transition-colors">
                {n.label}
              </Link>
            ))}
            <TrackedLink href="/devis" source="header" className="btn btn-ink !min-h-11 whitespace-nowrap">
              <span className="xl:hidden">Devis</span>
              <span className="hidden xl:inline">Demander un devis</span>
            </TrackedLink>
          </nav>

          <button
            type="button"
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center border border-stone-2 rounded-sm"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="burger" data-ouvert={open || undefined} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        {/* Toujours présent pour pouvoir se dérouler ; « inert » le retire du clavier et des lecteurs d'écran quand il est fermé. */}
        <nav
          id="menu-mobile"
          aria-label="Menu mobile"
          data-ouvert={open || undefined}
          inert={!open}
          className="menu-mobile lg:hidden absolute inset-x-0 top-full max-h-[calc(100dvh-var(--h-entete))] overflow-y-auto border-t border-stone-2 bg-paper px-5 py-5 grid gap-1 shadow-[0_24px_40px_rgb(27_31_29/0.12)]"
        >
          {nav.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={fermer}
              className="menu-item py-3 text-lg display"
              style={{ "--i": i } as React.CSSProperties}
            >
              {n.label}
            </Link>
          ))}
          <TrackedLink
            href="/devis"
            source="menu_mobile"
            onClickCapture={fermer}
            className="menu-item btn btn-ink mt-3"
            style={{ "--i": nav.length } as React.CSSProperties}
          >
            Demander un devis
          </TrackedLink>
        </nav>
      </header>
      {/* Fil de lecture : hors de l'en-tête, qui reçoit un transform quand il s'efface. */}
      <div className="fil-lecture" aria-hidden="true" />
    </>
  );
}
