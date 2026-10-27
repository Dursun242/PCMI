"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatEuro } from "@/lib/format";
import { calculerTaxe, TA_2026, type TaxeSaisie } from "@/lib/taxeAmenagement";
import { surfaceBucket, trackEvent } from "@/lib/analytics";

/** Saisies numériques gardées en texte : un champ vide ou « 2,5 » ne doit pas sauter pendant la frappe. */
interface Champs {
  surfaceTaxable: string;
  tauxCommunal: string;
  tauxDepartemental: string;
  tauxRegional: string;
  piscineM2: string;
  placesStationnement: string;
}

const nombre = (v: string) => (v.trim() === "" ? Number.NaN : Number(v.replace(",", ".")));
const optionnel = (v: string) => (v.trim() === "" ? 0 : nombre(v));

function Champ({ id, label, aide, suffixe, value, onChange }: {
  id: string;
  label: string;
  aide?: React.ReactNode;
  suffixe: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {aide && <p className="hint mt-1 normal-case tracking-normal">{aide}</p>}
      <div className="mt-2 flex items-center gap-3">
        <input id={id} type="text" inputMode="decimal" className="min-h-12" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="shrink-0 text-ink-2">{suffixe}</span>
      </div>
    </div>
  );
}

function Bascule({ name, legende, options, value, onChange }: {
  name: string;
  legende: string;
  options: [boolean, string][];
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <fieldset className="field">
      <legend>{legende}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map(([v, l]) => (
          <label key={l} className="opt flex items-center gap-3 border border-stone-2 bg-paper px-4 py-3 has-[:checked]:border-ink cursor-pointer min-h-12">
            <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} className="accent-ink h-4 w-4" />
            <span>{l}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Ligne({ libelle, montant, fort = false }: { libelle: string; montant: number; fort?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-2 ${fort ? "border-t border-ink font-bold" : "border-t border-stone-2"}`}>
      <dt>{libelle}</dt>
      <dd className="numeral">{formatEuro(montant)}</dd>
    </div>
  );
}

/**
 * Calculateur de taxe d'aménagement. Tout le calcul vit dans
 * src/lib/taxeAmenagement.ts (testé) ; ce composant ne fait que la saisie
 * et l'affichage. Rien n'est envoyé : le calcul se fait dans le navigateur.
 */
export default function CalculateurTaxe() {
  const [champs, setChamps] = useState<Champs>({
    surfaceTaxable: "120",
    tauxCommunal: "5",
    tauxDepartemental: "2,5",
    tauxRegional: "1",
    piscineM2: "",
    placesStationnement: "",
  });
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [ileDeFrance, setIleDeFrance] = useState(false);
  const [archeologie, setArcheologie] = useState(true);
  const maj = (k: keyof Champs) => (v: string) => setChamps((c) => ({ ...c, [k]: v }));

  const saisie: TaxeSaisie = {
    surfaceTaxable: nombre(champs.surfaceTaxable),
    residencePrincipale,
    ileDeFrance,
    tauxCommunal: nombre(champs.tauxCommunal),
    tauxDepartemental: nombre(champs.tauxDepartemental),
    tauxRegional: ileDeFrance ? nombre(champs.tauxRegional) : 0,
    piscineM2: optionnel(champs.piscineM2),
    placesStationnement: optionnel(champs.placesStationnement),
    archeologie,
  };
  const r = calculerTaxe(saisie);

  const dernierSuivi = useRef<string | null>(null);
  useEffect(() => {
    if (!r) return;
    const props = { surface_bucket: surfaceBucket(saisie.surfaceTaxable), residence: residencePrincipale ? "principale" : "secondaire" } as const;
    const cle = `${props.surface_bucket}|${props.residence}`;
    if (dernierSuivi.current === cle) return;
    dernierSuivi.current = cle;
    trackEvent("taxe_calcul_result", props);
  }, [r, saisie.surfaceTaxable, residencePrincipale]);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="grid gap-6">
        <Champ
          id="ta-surface"
          label="Surface taxable"
          suffixe="m²"
          value={champs.surfaceTaxable}
          onChange={maj("surfaceTaxable")}
          aide="Maison et annexes closes et couvertes (garage, cellier) de plus de 1,80 m sous plafond, mesurées à l'intérieur des murs."
        />
        <Bascule name="ta-residence" legende="Résidence principale ?" options={[[true, "Oui"], [false, "Non, secondaire ou locative"]]} value={residencePrincipale} onChange={setResidencePrincipale} />
        <Bascule name="ta-region" legende="Où se situe le terrain ?" options={[[false, "Hors Île-de-France"], [true, "En Île-de-France"]]} value={ileDeFrance} onChange={setIleDeFrance} />
        <div className="grid gap-6 sm:grid-cols-2">
          <Champ id="ta-communal" label="Taux communal" suffixe="%" value={champs.tauxCommunal} onChange={maj("tauxCommunal")} aide="De 1 à 5 %, jusqu'à 20 % dans certains secteurs." />
          <Champ id="ta-departemental" label="Taux départemental" suffixe="%" value={champs.tauxDepartemental} onChange={maj("tauxDepartemental")} aide="2,5 % au maximum." />
          {ileDeFrance && (
            <Champ id="ta-regional" label="Taux régional" suffixe="%" value={champs.tauxRegional} onChange={maj("tauxRegional")} aide="Île-de-France : 1 % au maximum." />
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Champ id="ta-piscine" label="Piscine (bassin)" suffixe="m²" value={champs.piscineM2} onChange={maj("piscineM2")} aide="Laissez vide sans piscine." />
          <Champ id="ta-parking" label="Places de parking extérieures" suffixe="places" value={champs.placesStationnement} onChange={maj("placesStationnement")} aide="Non couvertes. Laissez vide s'il n'y en a pas." />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={archeologie} onChange={(e) => setArcheologie(e.target.checked)} className="accent-ink mt-1 h-4 w-4" />
          <span className="text-[0.95rem] leading-relaxed">
            Inclure la taxe d&apos;archéologie préventive (0,40 %), due dès que les travaux touchent le sous-sol, ce qui est
            le cas de presque toutes les maisons.
          </span>
        </label>
      </div>

      <div className="lg:border-l lg:border-stone-2 lg:pl-16" aria-live="polite">
        {!r ? (
          <p className="border-t border-stone-2 pt-5 text-ink-2 lg:border-t-0 lg:pt-0">
            Vérifiez les valeurs saisies : surface en m², taux communal jusqu&apos;à 20 %, départemental jusqu&apos;à 2,5 %,
            régional jusqu&apos;à 1 %, nombre de places entier.
          </p>
        ) : (
          <div className="border-t border-ink pt-5 lg:border-t-0 lg:pt-0">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">Estimation {TA_2026.annee}</p>
            <p className="display mt-3 text-5xl">{formatEuro(r.total)}</p>
            <p className="mt-2 text-sm text-ink-2">Taxe d&apos;aménagement{archeologie ? " et taxe d'archéologie préventive" : ""}, à payer après l&apos;achèvement des travaux.</p>

            <dl className="mt-6 text-[0.95rem]">
              <Ligne libelle="Part communale" montant={r.partCommunale} />
              <Ligne libelle="Part départementale" montant={r.partDepartementale} />
              {ileDeFrance && <Ligne libelle="Part régionale" montant={r.partRegionale} />}
              {archeologie && <Ligne libelle="Archéologie préventive" montant={r.archeologie} />}
              <Ligne libelle="Total" montant={r.total} fort />
            </dl>
            <p className="mt-3 text-sm text-ink-2">Valeur taxable retenue : {formatEuro(r.base)}.</p>

            {r.echeances.length > 0 && (
              <div className="mt-6">
                <p className="font-bold">Quand la taxe d&apos;aménagement est demandée</p>
                <ul className="mt-2 grid gap-1.5 text-[0.95rem] text-ink-2">
                  {r.echeances.map((e) => (
                    <li key={e.quand}>{e.quand} : <span className="numeral text-ink">{formatEuro(e.montant)}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/devis?surface=${Math.round(saisie.surfaceTaxable)}`}
              className="btn btn-ink mt-8 w-full sm:w-auto"
              onClick={() => trackEvent("cta_click", { source: "calculateur_taxe" })}
            >
              Obtenir le prix de mon permis
            </Link>
            <p className="mt-4 text-sm text-ink-2">
              Estimation indicative : le montant définitif est calculé par l&apos;administration fiscale à partir de votre
              déclaration. Dans votre dossier de permis, nous calculons la surface taxable exacte et la déclarons sur le
              CERFA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
