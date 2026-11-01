"use client";

import Link from "next/link";
import { useState } from "react";
import ChampAdresse from "@/components/ChampAdresse";
import { CORRESPONDANCE_PIECES, HUB, PAGES_PLANCHES } from "@/config/planchesGratuites";

/**
 * Bloc « plan offert » de la page d'accueil. Un formulaire GET sans carte :
 * il pèse peu sur l'accueil et mène à /plans-gratuits, qui reprend l'adresse
 * et lance la recherche du terrain. Choisir une adresse proposée l'envoie
 * aussitôt ; sans JavaScript, le formulaire marche tel quel.
 */
export default function BlocPlanGratuit() {
  const [adresse, setAdresse] = useState("");
  return (
    <section className="border-b border-stone-2 bg-stone" aria-labelledby="plan-gratuit-titre">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">Offert · une planche par terrain</p>
          <h2 id="plan-gratuit-titre" className="h-section mt-4">
            Recevez gratuitement le plan de votre terrain
          </h2>
          <p className="mt-5 max-w-[48ch] leading-relaxed text-ink-2">
            Plan de situation, plan de masse ou plan de coupe, au choix : notre bureau d&apos;études le dessine
            d&apos;après le cadastre et l&apos;IGN et vous l&apos;envoie par e-mail en PDF A3, en quelques minutes.
          </p>
        </div>

        <div>
          <form action={`${HUB.path}#formulaire`} method="get" className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label htmlFor="accueil-adresse" className="sr-only">
              Adresse de votre terrain
            </label>
            <ChampAdresse
              id="accueil-adresse"
              name="adresse"
              value={adresse}
              onChange={setAdresse}
              onChoisir={(a) => window.location.assign(`${HUB.path}?${new URLSearchParams({ adresse: a })}#formulaire`)}
              required
              minLength={3}
              placeholder="Adresse de votre terrain"
              className="min-h-12 w-full border border-stone-2 bg-paper px-4"
            />
            <button type="submit" className="btn btn-ink !min-h-12 whitespace-nowrap">
              Recevoir mon plan gratuit
            </button>
          </form>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            {CORRESPONDANCE_PIECES.map((c) => (
              <li key={c.planche}>
                <Link href={PAGES_PLANCHES[c.planche].path} className="underline decoration-brass underline-offset-4 hover:text-ink">
                  {PAGES_PLANCHES[c.planche].court}
                </Link>{" "}
                <span className="text-[0.75rem] tracking-[0.08em] text-bronze">{c.pcmi}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
