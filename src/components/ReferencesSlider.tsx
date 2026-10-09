"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReferenceVitrine } from "@/lib/vitrine";

/** Temps d'affichage d'une référence avant de passer à la suivante. */
const DUREE_MS = 5500;

type Props = {
  items: ReferenceVitrine[];
  /** Nombre total de références, pour le lien vers la carte. */
  total: number;
};

/**
 * Carrousel des plus belles références de l'accueil : de vraies photos de
 * chantiers d'ID Maîtrise (src/config/references.ts, liste `vitrine`).
 *
 * Défile seul toutes les 5,5 s, avec une barre qui montre le temps restant ;
 * s'arrête au survol, au clavier, hors de l'écran, sur demande (bouton pause,
 * exigé pour un contenu qui bouge seul) et pour les personnes qui ont demandé
 * à réduire les animations. Au doigt, la piste se balaie nativement.
 * Styles : section « Carrousel des références » de globals.css.
 */
export default function ReferencesSlider({ items, total }: Props) {
  const section = useRef<HTMLElement>(null);
  const piste = useRef<HTMLUListElement>(null);
  const [actif, setActif] = useState(0);
  const [lecture, setLecture] = useState(true);
  const [suspendu, setSuspendu] = useState(false);
  const [aLEcran, setALEcran] = useState(false);
  const [reduit, setReduit] = useState(false);
  const n = items.length;

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const maj = () => setReduit(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    return () => mq.removeEventListener("change", maj);
  }, []);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setALEcran(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Fait défiler la piste jusqu'à la référence i (en boucle). */
  const aller = useCallback(
    (i: number) => {
      const ul = piste.current;
      if (!ul) return;
      const cible = ul.children[((i % n) + n) % n] as HTMLElement;
      const premier = ul.children[0] as HTMLElement;
      ul.scrollTo({ left: cible.offsetLeft - premier.offsetLeft, behavior: reduit ? "auto" : "smooth" });
    },
    [n, reduit],
  );

  // La référence active suit la position de la piste (boutons, balayage au doigt ou défilement auto).
  useEffect(() => {
    const ul = piste.current;
    if (!ul) return;
    let image = 0;
    const maj = () => {
      image = 0;
      // En butée à droite, les dernières références ne peuvent pas venir au bord : la dernière est active.
      if (ul.scrollLeft >= ul.scrollWidth - ul.clientWidth - 2) return setActif(n - 1);
      const premier = (ul.children[0] as HTMLElement).offsetLeft;
      let meilleur = 0;
      let ecart = Infinity;
      Array.from(ul.children).forEach((li, i) => {
        const d = Math.abs((li as HTMLElement).offsetLeft - premier - ul.scrollLeft);
        if (d < ecart) [ecart, meilleur] = [d, i];
      });
      setActif(meilleur);
    };
    const defile = () => {
      if (!image) image = requestAnimationFrame(maj);
    };
    ul.addEventListener("scroll", defile, { passive: true });
    return () => {
      ul.removeEventListener("scroll", defile);
      cancelAnimationFrame(image);
    };
  }, [n]);

  const enMarche = lecture && !suspendu && aLEcran && !reduit;

  useEffect(() => {
    if (!enMarche) return;
    const t = setTimeout(() => aller(actif + 1), DUREE_MS);
    return () => clearTimeout(t);
  }, [enMarche, actif, aller]);

  const deuxChiffres = (k: number) => String(k).padStart(2, "0");

  return (
    <section
      ref={section}
      aria-roledescription="carrousel"
      aria-label="Nos plus belles références"
      className="overflow-hidden py-20 sm:py-28"
      onMouseEnter={() => setSuspendu(true)}
      onMouseLeave={() => setSuspendu(false)}
      onFocus={() => setSuspendu(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSuspendu(false);
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-5 sm:px-8">
        <div className="max-w-[46ch]">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Des maisons réelles, conçues et suivies par notre bureau d&apos;études</h2>
          <p className="lead mt-6">
            Aucune photo d&apos;illustration : ce sont nos chantiers, menés autour du Havre. En voici quelques-uns parmi
            nos {total} références.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="mr-2 font-display text-xl tabular-nums" aria-hidden="true">
            {deuxChiffres(actif + 1)} <span className="text-ink-3">/ {deuxChiffres(n)}</span>
          </p>
          <button type="button" className="vitrine-bouton" aria-label="Référence précédente" onClick={() => aller(actif - 1)}>
            ←
          </button>
          <button
            type="button"
            className="vitrine-bouton"
            aria-label={lecture ? "Mettre le défilement en pause" : "Reprendre le défilement"}
            onClick={() => setLecture((v) => !v)}
          >
            {lecture ? "❚❚" : "▶"}
          </button>
          <button type="button" className="vitrine-bouton" aria-label="Référence suivante" onClick={() => aller(actif + 1)}>
            →
          </button>
        </div>
      </div>

      <ul ref={piste} className="vitrine-piste mt-12 flex gap-4 overflow-x-auto sm:gap-6">
        {items.map((r, i) => (
          <li
            key={r.photo}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${i + 1} sur ${n} : ${r.titre}, ${r.commune}`}
            data-actif={i === actif || undefined}
            className="vitrine-diapo relative aspect-[16/10] w-[86%] shrink-0 overflow-hidden bg-stone-2 sm:w-[72%] lg:w-[58%]"
          >
            <Image src={r.photo} alt={`${r.titre}, ${r.commune}`} fill sizes="(min-width: 1024px) 58vw, 86vw" className="object-cover" />
            <div className="vitrine-legende absolute inset-x-0 bottom-0 px-4 pb-4 pt-10 text-paper sm:px-7 sm:pb-7 sm:pt-16">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">{r.commune}</p>
              <p className="display mt-1 text-xl leading-tight sm:text-3xl">{r.titre}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 sm:px-8">
        <div className="relative h-px w-full max-w-xs bg-stone-2" aria-hidden="true">
          <span
            key={`${actif}-${enMarche}`}
            className={`vitrine-temps absolute inset-0 bg-bronze${enMarche ? "" : " arret"}`}
            style={{ animationDuration: `${DUREE_MS}ms` }}
          />
        </div>
        <Link href="/references-chantiers" className="btn btn-line">
          Voir les {total} références sur la carte
        </Link>
      </div>
    </section>
  );
}
