"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export interface EntreeMenu {
  href: string;
  label: string;
  /** Une ligne sous le libellé : ce que la page apporte. */
  detail?: string;
}

/**
 * Liste déroulante du menu principal (ordinateur). S'ouvre au survol, au clic
 * ou au clavier ; se ferme avec Échap, en cliquant ailleurs ou en quittant la
 * zone. Les liens restent dans le HTML même fermés (attribut hidden) : les
 * moteurs les suivent comme les autres liens du menu.
 */
export default function MenuDeroulant({ label, entrees }: { label: string; entrees: EntreeMenu[] }) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!ouvert) return;
    const ailleurs = (e: PointerEvent) => {
      if (!zone.current?.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOuvert(false);
      bouton.current?.focus();
    };
    document.addEventListener("pointerdown", ailleurs);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", ailleurs);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <div
      ref={zone}
      className="relative"
      onMouseEnter={() => setOuvert(true)}
      onMouseLeave={() => setOuvert(false)}
      onBlur={(e) => {
        if (!zone.current?.contains(e.relatedTarget as Node)) setOuvert(false);
      }}
    >
      <button
        ref={bouton}
        type="button"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={() => setOuvert((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1.5 transition-colors hover:text-bronze"
      >
        {label}
        <svg
          viewBox="0 0 10 6"
          width="10"
          height="6"
          aria-hidden="true"
          className={`transition-transform ${ouvert ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {/* pt-2 : pas de trou entre le bouton et la liste, le survol ne se perd pas en descendant. */}
      <div id={id} hidden={!ouvert} className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
        <ul className="w-80 border border-stone-2 bg-paper p-2 shadow-[0_24px_40px_rgb(27_31_29/0.12)]">
          {entrees.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                onClick={() => setOuvert(false)}
                className="block whitespace-normal px-4 py-3 transition-colors hover:bg-stone focus-visible:bg-stone"
              >
                <span className="block text-[0.95rem] text-ink">{e.label}</span>
                {e.detail && <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-2">{e.detail}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
