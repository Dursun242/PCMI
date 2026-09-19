"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";
import TrackedLink from "./TrackedLink";

const nav = [
  { href: "/tarifs", label: "Permis de construire" },
  { href: "/plans-execution", label: "Plans EXE" },
  { href: "/etude-thermique-re2020", label: "Étude RE2020" },
  { href: "/permis-de-construire-maison", label: "Le guide" },
  { href: "/conseils", label: "Conseils" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-paper/92 backdrop-blur border-b border-stone-2">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-[4.5rem] flex items-center justify-between gap-4">
        <Link href="/" aria-label="Accueil">
          <Logo priority compact />
        </Link>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[0.92rem] whitespace-nowrap">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brass transition-colors">
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
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            {open ? <path d="M4 4l14 14M18 4L4 18" /> : <path d="M3 6h16M3 11h16M3 16h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" className="lg:hidden border-t border-stone-2 bg-paper px-5 py-5 grid gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-3 text-lg display">
              {n.label}
            </Link>
          ))}
          <TrackedLink
            href="/devis"
            source="menu_mobile"
            onClickCapture={() => setOpen(false)}
            className="btn btn-ink mt-3"
          >
            Demander un devis
          </TrackedLink>
        </nav>
      )}
    </header>
  );
}
