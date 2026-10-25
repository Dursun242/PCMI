"use client";

import { useRef } from "react";

const SOURCE_TELEPHONE = "/videos/deroule-permis-en-ligne-mobile.mp4";
const SOURCE_ORDINATEUR = "/videos/deroule-permis-en-ligne.mp4";
const IMAGE = "/videos/deroule-permis-en-ligne.jpg";

/**
 * Bouton du haut de l'accueil : ouvre la vidéo du déroulé en grand, AVEC le son.
 * Le clic du visiteur autorise la lecture sonore (impossible en lecture automatique),
 * d'où un bouton plutôt qu'une vidéo à la place de l'animation du haut de page.
 * Rien n'est téléchargé avant le clic. <dialog> natif : Échap et le bouton ferment.
 */
export default function VideoDerouleBouton() {
  const fenetre = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  function ouvrir() {
    const d = fenetre.current;
    const v = video.current;
    if (!d || !v) return;
    if (!v.getAttribute("src")) {
      v.poster = IMAGE;
      v.src = window.innerWidth < 768 ? SOURCE_TELEPHONE : SOURCE_ORDINATEUR;
    }
    d.showModal();
    v.currentTime = 0;
    v.muted = false;
    void v.play().catch(() => {});
  }

  return (
    <>
      <button type="button" onClick={ouvrir} className="group inline-flex items-center gap-3 text-left text-paper">
        <span
          aria-hidden="true"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brass-2/70 transition-colors group-hover:bg-brass-2 group-hover:text-forest"
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor"><path d="M1 1v14l12-7z" /></svg>
        </span>
        <span>
          <span className="block font-bold underline decoration-brass-2 underline-offset-4 group-hover:text-brass-2">Voir comment ça marche</span>
          <span className="block text-sm text-paper/65">40 secondes, avec Dursun, gérant d&apos;ID Maîtrise</span>
        </span>
      </button>

      <dialog
        ref={fenetre}
        aria-label="Vidéo : comment se passe votre permis de construire"
        onClose={() => video.current?.pause()}
        onClick={(e) => e.target === fenetre.current && fenetre.current?.close()}
        className="m-auto w-[min(94vw,1100px)] max-w-none bg-transparent p-0 backdrop:bg-black/85"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => fenetre.current?.close()}
            className="mb-2 inline-flex h-10 items-center gap-2 px-1 text-sm font-bold text-paper hover:text-brass-2"
          >
            Fermer
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" /></svg>
          </button>
        </div>
        {/* Image d'attente posée à l'ouverture seulement : rien n'est chargé avant le clic. */}
        <video ref={video} data-mesure="déroulé (bouton du haut)" className="block aspect-video w-full bg-forest" controls playsInline preload="none" />
      </dialog>
    </>
  );
}
