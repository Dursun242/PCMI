"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import TelLink from "@/components/TelLink";
import { express } from "@/config/site";
import { surfaceBucket, trackEvent } from "@/lib/analytics";
import { CURSEUR_SURFACE, eligibleExpress, EVENEMENT_SURFACE } from "@/lib/express";
import { formatEuro } from "@/lib/format";

const { min, max, pas, depart } = CURSEUR_SURFACE;
/** Position d'une surface sur le curseur, en pourcentage de la piste. */
const position = (surface: number) => ((surface - min) / (max - min)) * 100;

/**
 * « Votre maison est-elle éligible ? » : le visiteur fait glisser la surface de
 * plancher et la réponse change sous ses yeux (offre Express jusqu'à 150 m²,
 * architecte au-delà). La surface choisie part avec le formulaire (événement
 * EVENEMENT_SURFACE, écouté par ExpressForm) ; chaque tranche de surface est
 * mesurée une fois, après une courte pause du curseur.
 */
export default function ExpressEligibilite() {
  const [surface, setSurface] = useState<number>(depart);
  const [touche, setTouche] = useState(false);
  const tranchesMesurees = useRef(new Set<string>());
  const eligible = eligibleExpress({ surface });

  useEffect(() => {
    if (!touche) return;
    window.dispatchEvent(new CustomEvent(EVENEMENT_SURFACE, { detail: surface }));
    const tranche = surfaceBucket(surface);
    if (tranchesMesurees.current.has(tranche)) return;
    const id = window.setTimeout(() => {
      tranchesMesurees.current.add(tranche);
      trackEvent("express_calcul", { surface_bucket: tranche });
    }, 1200);
    return () => window.clearTimeout(id);
  }, [surface, touche]);

  return (
    <div data-zone="calcul" className="mt-8 sm:mt-10 border border-paper/20 bg-forest-2/60 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor="surface-calcul" className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-brass-2">
          Votre maison est-elle éligible&nbsp;?
        </label>
        <output htmlFor="surface-calcul" className="display text-3xl sm:text-4xl leading-none lining-nums tabular-nums">
          {surface}&nbsp;m²
        </output>
      </div>
      <p className="mt-1 text-sm text-paper/70">Faites glisser : surface de plancher de votre future maison.</p>

      <div className="relative mt-5 pb-5">
        {/* Repère du seuil posé avant le curseur : le bouton passe par-dessus. */}
        <span className="curseur-seuil" aria-hidden="true" style={{ left: `${position(express.surfaceMax)}%` }}>
          {express.surfaceMax}&nbsp;m²
        </span>
        <input
          id="surface-calcul"
          type="range"
          min={min}
          max={max}
          step={pas}
          value={surface}
          onChange={(e) => {
            setSurface(Number(e.target.value));
            setTouche(true);
          }}
          aria-valuetext={`${surface} mètres carrés`}
          className="curseur relative"
          style={{ "--p": `${position(surface)}%`, "--seuil": `${position(express.surfaceMax)}%` } as CSSProperties}
        />
      </div>

      {/* La clé relance l'apparition quand la réponse bascule. */}
      <div key={eligible ? "oui" : "non"} className="calcul-reponse mt-4" role="status">
        {eligible ? (
          <>
            <p className="display text-2xl leading-tight sm:text-3xl">
              <span aria-hidden="true" className="calcul-coche">✓</span> Éligible à l&apos;offre {express.nom}
            </p>
            <p className="mt-1 text-paper/80">
              {formatEuro(express.prixTTC)} TTC, prix fixe · dossier prêt en {express.delai}
            </p>
            <a href="#devis" className="btn btn-paper mt-5 w-full sm:w-auto">
              Je réserve mon devis
            </a>
          </>
        ) : (
          <>
            <p className="display text-2xl leading-tight sm:text-3xl">
              Au-delà de {express.surfaceMax}&nbsp;m², un architecte est obligatoire
            </p>
            <p className="mt-1 max-w-[52ch] text-paper/80">
              C&apos;est la loi, et c&apos;est hors offre {express.nom}. Nous établissons votre permis sur devis, avec notre
              architecte partenaire : appelez-nous, nous vous orientons dès le premier appel.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex">
              <TelLink source="express_calcul" className="btn btn-paper !px-3 sm:!px-7">
                Appeler
              </TelLink>
              <a href="#devis" className="btn btn-line-light !px-3 sm:!px-7">
                Être rappelé
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
