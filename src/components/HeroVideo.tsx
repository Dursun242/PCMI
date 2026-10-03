"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Repli pour les navigateurs sans vidéo (le dessin SVG). */
  children: ReactNode;
};

/**
 * Vidéo de la façade qui se dessine (20 s, muette, en boucle). Lancée après
 * le chargement plutôt qu'en autoplay natif, pour ne pas l'animer chez les
 * visiteurs qui ont demandé moins de mouvement (affiche fixe à la place), et
 * accompagnée d'un bouton pause : une animation de plus de 5 s doit pouvoir
 * être arrêtée (WCAG 2.2.2).
 */
export default function HeroVideo({ children }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Lecture refusée (mode économie d'énergie…) : l'affiche reste, rien à faire.
    video.play().catch(() => {});
  }, []);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  return (
    <>
      <video
        ref={ref}
        className="w-full h-auto aspect-video object-cover [mask-image:radial-gradient(ellipse_at_center,#000_58%,transparent_100%)]"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero/facade-poster.jpg"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        aria-label="Façade d'une maison contemporaine qui se dessine trait par trait, comme sur la planche PCMI 5"
      >
        <source src="/hero/facade.mp4" type="video/mp4" />
        {children}
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Mettre l'animation en pause" : "Lire l'animation"}
        className="absolute bottom-3 left-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-brass/60 bg-forest/80 text-paper transition-colors hover:border-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          {isPlaying ? <path d="M3 2h3v10H3zM8 2h3v10H8z" /> : <path d="M3.5 2v10l8-5z" />}
        </svg>
      </button>
    </>
  );
}
