"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEuro } from "@/lib/format";
import { surfaceBucket, trackEvent } from "@/lib/analytics";
import {
  calculerPanier,
  echeanciersPossibles,
  formatCentimes,
  formulesCommande,
  mentionFacturation,
  optionsCommande,
  validerCommande,
  type FormuleCommandeId,
  type NombreEcheances,
  type OptionCommandeId,
} from "@/lib/commande";
import EtapeCoordonnees, { type ChampsCoordonnees } from "./EtapeCoordonnees";
import EtapeDevis from "./EtapeDevis";
import EtapeIban from "./EtapeIban";
import { ecrireCommandeEnCours, lireCommandeEnCours, type CommandeEnCours } from "./commandeEnCours";

/**
 * Le parcours complet, affiché dès le départ, comme sur un site marchand :
 * panier, coordonnées, règlement, devis à accepter, puis l'IBAN chez Qonto.
 */
const ETAPES = ["Panier", "Coordonnées", "Règlement", "Devis", "IBAN"] as const;
type Etape = 0 | 1 | 2 | 3 | 4;

const INTRO_ETAPE: Record<Etape, string> = {
  0: "Choisissez votre formule et, si besoin, des options. Le total se met à jour au fur et à mesure.",
  1: "Ces informations rempliront votre devis et votre mandat de prélèvement : vous n'aurez pas à les saisir deux fois.",
  2: "Choisissez en combien de fois vous réglez. Aucun prélèvement aujourd'hui. Préparez votre RIB : votre IBAN vous sera demandé à la dernière étape.",
  3: "Relisez votre devis et votre échéancier, puis signez-le en un clic.",
  4: "Dernière étape : votre IBAN, sur la page sécurisée de notre banque.",
};

type Envoi = { etat: "repos" } | { etat: "envoi" } | { etat: "erreur"; message: string };

const ECHEANCES_PAR_DEFAUT: NombreEcheances = 10;

/**
 * Tunnel de commande : panier → coordonnées → règlement par prélèvement SEPA.
 * Les montants affichés sont calculés avec les mêmes fonctions que le serveur,
 * qui les recalcule de toute façon à l'envoi.
 */
export default function CommandeTunnel({ presetFormule, presetSurface }: { presetFormule?: string; presetSurface?: string }) {
  const formuleInitiale =
    formulesCommande.find((f) => f.id === presetFormule)?.id ??
    formulesCommande.find((f) => f.highlight)?.id ??
    formulesCommande[0].id;

  const [etape, setEtape] = useState<Etape>(0);
  const [formule, setFormule] = useState<FormuleCommandeId>(formuleInitiale);
  const [quantites, setQuantites] = useState<Partial<Record<OptionCommandeId, number>>>({});
  const [coordonnees, setCoordonnees] = useState<ChampsCoordonnees>((): ChampsCoordonnees =>
    presetSurface && Number(presetSurface) > 0 ? { surface: String(Math.round(Number(presetSurface))) } : {},
  );
  const [nombre, setNombre] = useState<NombreEcheances>(ECHEANCES_PAR_DEFAUT);
  const [erreurEtape, setErreurEtape] = useState("");
  const [envoi, setEnvoi] = useState<Envoi>({ etat: "repos" });
  const [enCours, setEnCours] = useState<CommandeEnCours | null>(null);
  // Après un rechargement, le panier affiché ne serait plus celui de la commande : on ne l'affiche pas.
  const [reprise, setReprise] = useState(false);

  // Commande déjà créée dans cet onglet (page rechargée) : on reprend au devis, ou à l'IBAN s'il est accepté.
  useEffect(() => {
    const c = lireCommandeEnCours();
    if (c) {
      setEnCours(c);
      setReprise(true);
      setEtape(c.accepte ? 4 : 3);
    }
  }, []);

  function devisAccepte(jeton: string) {
    if (!enCours) return;
    const c: CommandeEnCours = { ...enCours, jeton, accepte: true };
    ecrireCommandeEnCours(c);
    setEnCours(c);
    allerA(4);
  }

  // Une option déjà incluse dans la formule choisie ne compte plus.
  const optionsValides = Object.fromEntries(
    Object.entries(quantites).filter(([id]) => optionsCommande.find((o) => o.id === id)?.formules.includes(formule)),
  );
  const panier = calculerPanier({ formule, options: optionsValides });
  const echeanciers = panier ? echeanciersPossibles(panier.totalTTC) : [];
  const choixEcheancier = echeanciers.find((e) => e.nombre === nombre) ?? echeanciers[echeanciers.length - 1];

  function allerA(suivante: Etape) {
    setErreurEtape("");
    setEtape(suivante);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validerEtapeCoordonnees() {
    // Même vérification que le serveur, terrain et surface compris (l'Express a ses propres limites).
    const r = validerCommande({ panier: { formule, options: optionsValides }, coordonnees, echeances: 1 });
    if (!r.ok) {
      setErreurEtape(r.erreur);
      return;
    }
    allerA(2);
  }

  async function passerAuPaiement() {
    if (!panier || !choixEcheancier) return;
    setEnvoi({ etat: "envoi" });
    try {
      const res = await fetch("/api/commande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panier: { formule, options: optionsValides },
          coordonnees,
          echeances: choixEcheancier.nombre,
          website: "",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Envoi impossible.");
      trackEvent("commande_submit", { formule, echeances: String(choixEcheancier.nombre), surface_bucket: surfaceBucket(coordonnees.surface ?? "") });
      const c: CommandeEnCours = { jeton: json.jeton, urlMandat: json.urlMandat };
      ecrireCommandeEnCours(c);
      setEnCours(c);
      setEnvoi({ etat: "repos" });
      allerA(3);
    } catch (err) {
      setEnvoi({ etat: "erreur", message: err instanceof Error ? err.message : "Envoi impossible." });
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      {/* min-w-0 : sans lui, un contenu large (le devis) élargirait la colonne au-delà de l'écran. */}
      <div className="min-w-0">
        <ol className="flex flex-wrap gap-x-6 gap-y-2 border-b border-stone-2 pb-4 text-sm" aria-label="Étapes de la commande">
          {ETAPES.map((nom, i) => (
            <li
              key={nom}
              aria-current={i === etape ? "step" : undefined}
              className={i === etape ? "font-bold text-ink" : i < etape ? "text-ink" : "text-ink-3"}
            >
              <span className="numeral text-bronze">{i < etape ? "✓" : String(i + 1).padStart(2, "0")}</span> {nom}
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-[60ch] text-ink-2">{INTRO_ETAPE[etape]}</p>

        <div className="mt-10">
          {etape === 0 && (
            <EtapePanier formule={formule} onFormule={setFormule} quantites={quantites} onQuantites={setQuantites} />
          )}
          {etape === 1 && (
            <EtapeCoordonnees
              valeurs={coordonnees}
              onChange={setCoordonnees}
              surfaceMax={formulesCommande.find((f) => f.id === formule)?.surfaceMax}
            />
          )}
          {etape === 2 && choixEcheancier && (
            <EtapeReglement echeanciers={echeanciers} choix={choixEcheancier.nombre} onChoix={setNombre} />
          )}
          {etape === 3 && enCours && <EtapeDevis jeton={enCours.jeton} onAccepte={devisAccepte} />}
          {etape === 4 && enCours && (
            <EtapeIban jeton={enCours.jeton} urlMandat={enCours.urlMandat} onTermine={() => ecrireCommandeEnCours(null)} />
          )}
        </div>

        {erreurEtape && (
          <p role="alert" className="mt-8 border-l-2 border-alert pl-4 text-sm text-alert">{erreurEtape}</p>
        )}
        {envoi.etat === "erreur" && (
          <p role="alert" className="mt-8 border-l-2 border-alert pl-4 text-sm text-alert">{envoi.message}</p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {etape > 0 && etape < 3 && (
            <button type="button" className="btn btn-line" onClick={() => allerA((etape - 1) as Etape)}>
              Retour
            </button>
          )}
          {etape === 0 && (
            <button type="button" className="btn btn-ink" onClick={() => allerA(1)} disabled={!panier}>
              Valider mon panier
            </button>
          )}
          {etape === 1 && (
            <button type="button" className="btn btn-ink" onClick={validerEtapeCoordonnees}>
              Passer au règlement
            </button>
          )}
          {etape === 2 && (
            <button type="button" className="btn btn-ink" onClick={passerAuPaiement} disabled={envoi.etat === "envoi"}>
              {envoi.etat === "envoi" ? "Préparation de votre devis…" : "Voir mon devis"}
            </button>
          )}
        </div>
      </div>

      <div className="grid h-fit min-w-0 gap-6 lg:sticky lg:top-24">
        {!reprise && <RecapPanier lignes={panier?.lignes ?? []} totalTTC={panier?.totalTTC ?? 0} echeance={choixEcheancier} afficherEcheance={etape >= 2} />}
        <AideCommande />
      </div>
    </div>
  );
}

interface EtapePanierProps {
  formule: FormuleCommandeId;
  onFormule: (id: FormuleCommandeId) => void;
  quantites: Partial<Record<OptionCommandeId, number>>;
  onQuantites: (q: Partial<Record<OptionCommandeId, number>>) => void;
}

function EtapePanier({ formule, onFormule, quantites, onQuantites }: EtapePanierProps) {
  const options = optionsCommande.filter((o) => o.formules.includes(formule));
  return (
    <div className="grid gap-10">
      <fieldset className="grid gap-3">
        <legend className="display mb-4 text-3xl">Votre formule</legend>
        {formulesCommande.map((f) => (
          <label
            key={f.id}
            className="flex cursor-pointer items-start gap-4 border border-stone-2 bg-paper px-5 py-4 has-[:checked]:border-ink"
          >
            <input type="radio" name="formule" checked={formule === f.id} onChange={() => onFormule(f.id)} className="mt-1.5 accent-ink h-4 w-4" />
            <span className="grow">
              <span className="display text-2xl">{f.name}</span>
              <span className="block text-sm text-ink-2">{f.promise} Livré sous {f.delai}.</span>
            </span>
            <span className="text-right">
              <span className="numeral block text-lg">{formatEuro(f.priceTTC)}</span>
              {f.regularPriceTTC && <s className="numeral block text-sm text-ink-3">{formatEuro(f.regularPriceTTC)}</s>}
            </span>
          </label>
        ))}
        <Link href="/tarifs" className="text-sm underline decoration-brass underline-offset-2">Comparer les formules en détail</Link>
      </fieldset>

      {options.length > 0 && (
        <fieldset className="grid gap-3">
          <legend className="display mb-4 text-3xl">Options</legend>
          {options.map((o) => (
            <div key={o.id} className="flex items-center gap-4 border-b border-stone-2 py-3">
              <div className="grow">
                <div className="font-bold">{o.name}</div>
                <div className="text-sm text-ink-2">{o.note} {formatEuro(o.priceTTC)}</div>
              </div>
              <label className="sr-only" htmlFor={`option-${o.id}`}>Quantité : {o.name}</label>
              <select
                id={`option-${o.id}`}
                className="border-b border-ink-3 bg-transparent py-2"
                value={quantites[o.id] ?? 0}
                onChange={(e) => onQuantites({ ...quantites, [o.id]: Number(e.target.value) })}
              >
                {Array.from({ length: o.quantiteMax + 1 }, (_, n) => (
                  <option key={n} value={n}>{n === 0 ? "Non" : o.quantiteMax === 1 ? "Oui" : n}</option>
                ))}
              </select>
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}

interface EtapeReglementProps {
  echeanciers: { nombre: NombreEcheances; montantCentimes: number }[];
  choix: NombreEcheances;
  onChoix: (n: NombreEcheances) => void;
}

function EtapeReglement({ echeanciers, choix, onChoix }: EtapeReglementProps) {
  const choisi = echeanciers.find((e) => e.nombre === choix);
  return (
    <fieldset className="grid gap-3">
      <legend className="display mb-4 text-3xl">Règlement par prélèvement SEPA</legend>
      {echeanciers.map((e) => (
        <label
          key={e.nombre}
          className="flex cursor-pointer items-center gap-4 border border-stone-2 bg-paper px-5 py-4 has-[:checked]:border-ink"
        >
          <input type="radio" name="echeances" checked={choix === e.nombre} onChange={() => onChoix(e.nombre)} className="accent-ink h-4 w-4" />
          <span className="grow font-bold">{e.nombre === 1 ? "En 1 fois" : `En ${e.nombre} fois sans frais`}</span>
          <span className="numeral text-lg">
            {e.nombre === 1 ? formatCentimes(e.montantCentimes) : `${e.nombre} × ${formatCentimes(e.montantCentimes)}`}
          </span>
        </label>
      ))}
      {choisi && <p className="mt-2 border-l-2 border-brass pl-4 text-sm text-ink">{mentionFacturation(choisi)}</p>}
      <p className="mt-4 text-sm text-ink-2">
        Rien n&apos;est prélevé à la commande : nous vérifions d&apos;abord que votre terrain permet le dépôt du permis.
      </p>
      <p className="text-sm text-ink-2">
        À l&apos;étape suivante, vous relisez et signez votre devis, avec les{" "}
        <Link href="/cgv" className="underline decoration-brass underline-offset-2">conditions générales de vente</Link>, puis vous saisissez
        votre IBAN sur la page sécurisée de notre banque, Qonto : votre commande est alors confirmée.
      </p>
    </fieldset>
  );
}

interface RecapPanierProps {
  lignes: { libelle: string; quantite: number; totalTTC: number }[];
  totalTTC: number;
  echeance?: { nombre: NombreEcheances; montantCentimes: number };
  afficherEcheance: boolean;
}

function RecapPanier({ lignes, totalTTC, echeance, afficherEcheance }: RecapPanierProps) {
  return (
    <aside className="border border-ink bg-paper p-6" aria-label="Récapitulatif de la commande">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-bronze">Votre commande</p>
      <ul className="mt-4 grid gap-2 text-sm">
        {lignes.map((l) => (
          <li key={l.libelle} className="flex justify-between gap-4">
            <span>{l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle}</span>
            <span className="numeral">{formatEuro(l.totalTTC)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-stone-2 pt-4 font-bold">
        <span>Total TTC</span>
        <span className="numeral text-xl">{formatEuro(totalTTC)}</span>
      </div>
      {afficherEcheance && echeance && echeance.nombre > 1 && (
        <p className="mt-2 text-right text-sm text-ink-2">
          soit {echeance.nombre} × {formatCentimes(echeance.montantCentimes)}
        </p>
      )}
    </aside>
  );
}

/** Toujours visible à côté du panier : ce qui rassure, sans détourner de la commande. */
function AideCommande() {
  return (
    <div className="grid gap-3 border-l-2 border-brass pl-5 text-sm text-ink-2">
      <p>
        <strong className="text-ink">Rien n&apos;est prélevé aujourd&apos;hui.</strong> Nous vérifions d&apos;abord que
        votre terrain permet le dépôt du permis.
      </p>
      <p>Vous pouvez vous rétracter pendant 14 jours après la signature, sans frais ni justification.</p>
    </div>
  );
}
