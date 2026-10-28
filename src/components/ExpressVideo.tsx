"use client";

import { useEffect, useRef, useState } from "react";
import { noterVideo } from "@/lib/suiviClient";

const SOURCE_TELEPHONE = "/videos/deroule-permis-en-ligne-mobile.mp4"; // 720p, 1,6 Mo
const SOURCE_ORDINATEUR = "/videos/deroule-permis-en-ligne.mp4"; // 1080p, 3,4 Mo
const IMAGE = "/videos/deroule-permis-en-ligne.jpg";

/**
 * Vidéo du déroulé (motion design et voix off du gérant, 39 s) sur l'accueil (retirée de /permis-express : peu regardée).
 * Chargée seulement à l'approche (version légère sur téléphone), lancée sans
 * le son quand elle est à moitié visible, mise en pause quand on s'en éloigne.
 * Les navigateurs interdisent le son automatique : un bouton l'active et
 * reprend la vidéo au début. Rien ne démarre seul si le visiteur a demandé
 * à réduire les animations. Ce que le visiteur en fait part dans le bilan de visite.
 */
export default function ExpressVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [son, setSon] = useState(false);
  const [lecture, setLecture] = useState(false);
  const [finie, setFinie] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const approche = new IntersectionObserver(([e]) => e.isIntersecting && charger(v), { rootMargin: "400px 0px" });
    const visible = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.5 && !reduit && !v.ended) {
          charger(v);
          void v.play().catch(() => {});
        } else if (e.intersectionRatio < 0.2) v.pause();
      },
      { threshold: [0, 0.2, 0.5] },
    );
    approche.observe(v);
    visible.observe(v);
    return () => {
      approche.disconnect();
      visible.disconnect();
    };
  }, []);

  function basculerSon() {
    const v = ref.current;
    if (!v) return;
    if (v.muted) {
      if (!son) v.currentTime = 0; // première écoute : depuis le début
      v.muted = false;
      setSon(true);
      noterVideo("son");
      charger(v);
      void v.play().catch(() => {});
    } else {
      v.muted = true;
      setSon(false);
    }
  }

  function lirePause() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) noterVideo("clic");
    charger(v);
    if (v.ended) v.currentTime = 0;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }

  return (
    <div className="relative overflow-hidden bg-forest shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
      <video
        ref={ref}
        data-mesure="déroulé"
        className="block aspect-video w-full"
        poster={IMAGE}
        muted
        playsInline
        preload="none"
        aria-label="Vidéo : du premier appel au dépôt du permis, en quatre étapes"
        onPlay={() => {
          setLecture(true);
          setFinie(false);
          noterVideo("vue");
        }}
        onPause={() => setLecture(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          const part = v.duration ? v.currentTime / v.duration : 0;
          if (part >= 0.25) noterVideo("q25");
          if (part >= 0.5) noterVideo("q50");
          if (part >= 0.75) noterVideo("q75");
        }}
        onEnded={() => {
          setLecture(false);
          setFinie(true);
          noterVideo("fin");
        }}
      />
      <div className="absolute bottom-2 left-2 flex gap-1.5 sm:bottom-5 sm:left-5 sm:gap-2">
        <button type="button" onClick={basculerSon} aria-pressed={son} className="btn btn-paper !min-h-8 !px-3 text-xs shadow-md sm:!min-h-10 sm:!px-4 sm:text-sm">
          {son ? "Couper le son" : "Activer le son"}
        </button>
        <button type="button" onClick={lirePause} className="btn btn-line-light !min-h-8 !px-3 text-xs bg-forest/60 backdrop-blur sm:!min-h-10 sm:!px-4 sm:text-sm">
          {finie ? "Revoir" : lecture ? "Pause" : "Lire"}
        </button>
      </div>
    </div>
  );
}

/** Choisit la source au premier besoin : version légère sous 768 px de large. */
function charger(v: HTMLVideoElement) {
  if (!v.getAttribute("src")) v.src = window.innerWidth < 768 ? SOURCE_TELEPHONE : SOURCE_ORDINATEUR;
}
