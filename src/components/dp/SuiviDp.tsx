"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AttenteDp from "@/components/dp/AttenteDp";
import { mesurerDp } from "@/lib/mesureDp";
import { PRIX_DP_PISCINE_TTC } from "@/lib/dpPiscine";

interface Vue {
  ok: boolean;
  error?: string;
  statut: "en_cours" | "pret" | "a_verifier" | "bloque" | "hors_dp" | "echec";
  cree: number;
  maintenant: number;
  reference: string;
  commune: string;
  resume: {
    motifRegime: string;
    pieces: string[];
    aVerifier: string[];
    echecs: string[];
    taxe: { base: number; total: number; tauxCommunal: number; tauxDep: number } | null;
    delai: string;
    distances: number[];
    arase: number | null;
  } | null;
  apercus: string[];
  guide: string;
  payable: boolean;
  paye: boolean;
  paiementEnCours: boolean;
  urlPaiement: string | null;
  erreur: string | null;
  admin: boolean;
}

const etiquette = "text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze";
const lien = "text-ink underline decoration-brass underline-offset-4";
const euros = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
/** Rythme de relecture du dossier (voir l'effet d'attente dans SuiviDp). */
const PAS_PREPARATION_MS = 10_000;
const PAS_PAIEMENT_MS = 20_000;
const ATTENTE_MAX_MS = 15 * 60_000;
const TITRES = ["DP1 / DPC1 · Plan de situation", "DP2 / DPC2 · Plan de masse", "DP3 / DPC3 · Plan en coupe"];

/** Suivi d'une DP piscine : préparation, aperçu, paiement, téléchargement. */
export default function SuiviDp() {
  const [p, setP] = useState<{ id: string; k: string } | null>(null);
  const [v, setV] = useState<Vue | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cgv, setCgv] = useState(false);
  const [paiement, setPaiement] = useState<"repos" | "envoi">("repos");

  useEffect(() => {
    const s = new URLSearchParams(window.location.search);
    setP({ id: s.get("id") ?? "", k: s.get("k") ?? "" });
  }, []);

  const charger = useCallback(async () => {
    if (!p) return;
    try {
      const r = await fetch(`/api/dp-piscine/statut?${new URLSearchParams(p)}`, { cache: "no-store" });
      const json = (await r.json()) as Vue;
      if (!json.ok) setErreur(json.error ?? "Dossier introuvable : ouvrez le lien reçu par e-mail.");
      else setV(json);
    } catch {
      /* réseau coupé : on réessaie au tour suivant */
    }
  }, [p]);

  useEffect(() => {
    void charger();
  }, [charger]);

  // On interroge le serveur tant que le dossier se prépare ou qu'un paiement est en cours. Chaque relecture coûte
  // une opération Vercel Blob (2 000 par mois en offre gratuite, tout le site confondu) : jamais quand l'onglet est
  // caché, et arrêt au bout de ATTENTE_MAX_MS (bouton « Actualiser », ou retour sur l'onglet).
  const attendre = v?.statut === "en_cours" || Boolean(v?.paiementEnCours);
  const preparation = v?.statut === "en_cours";
  const [enPause, setEnPause] = useState(false);
  useEffect(() => {
    if (!attendre) return;
    let debut = Date.now();
    setEnPause(false);
    const t = setInterval(
      () => {
        if (document.visibilityState !== "visible") return;
        if (Date.now() - debut > ATTENTE_MAX_MS) return setEnPause(true);
        void charger();
      },
      preparation ? PAS_PREPARATION_MS : PAS_PAIEMENT_MS,
    );
    const auRetour = () => {
      if (document.visibilityState !== "visible") return;
      debut = Date.now();
      setEnPause(false);
      void charger();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [attendre, preparation, charger]);

  const actualiser = (
    <button type="button" className="btn btn-line w-fit" onClick={() => { setEnPause(false); void charger(); }}>
      Actualiser
    </button>
  );

  useEffect(() => {
    // Une fois par dossier et par onglet : la page relit le dossier toutes les quelques secondes.
    if (v && p && v.statut !== "en_cours") mesurerDp("apercu", p.id);
  }, [v?.statut]); // eslint-disable-line react-hooks/exhaustive-deps

  async function payer(test = false) {
    if (!p) return;
    setPaiement("envoi");
    setErreur(null);
    try {
      const r = await fetch("/api/dp-piscine/payer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, cgv, test }),
      });
      const json = await r.json();
      if (!json.ok) setErreur(json.error ?? "Le paiement n'a pas pu démarrer.");
      else if (json.url) {
        mesurerDp("payer");
        window.open(json.url, "_blank", "noopener");
        await charger();
      } else {
        setV({ ...(v as Vue), ...json });
      }
    } catch {
      setErreur("Le paiement n'a pas pu démarrer. Vérifiez votre connexion.");
    }
    setPaiement("repos");
  }

  if (erreur && !v) return <p role="alert" className="border-l-2 border-alert pl-4 text-alert">{erreur}</p>;
  if (!v) return <p className="text-ink-2">Chargement de votre dossier…</p>;

  if (v.statut === "en_cours") {
    return (
      <div role="status" className="grid gap-4 border-l-2 border-brass py-2 pl-6">
        <p className={etiquette}>Parcelle {v.reference} · {v.commune}</p>
        <p className="display text-4xl">Nous dessinons votre dossier.</p>
        <p className="max-w-[56ch] leading-relaxed text-ink-2">
          Plan de situation, plan de masse coté, plan en coupe et Cerfa 16702. Cette page se met à jour toute seule ; vous
          pouvez aussi la fermer, le lien est dans votre e-mail.
        </p>
        {p && <AttenteDp id={p.id} k={p.k} cree={v.cree} maintenantServeur={v.maintenant} />}
        {enPause && actualiser}
      </div>
    );
  }

  if (v.statut === "echec" || v.statut === "bloque" || v.statut === "hors_dp") {
    const titres = {
      hors_dp: "Pas de déclaration préalable pour ce projet.",
      bloque: "Un point à corriger avant votre dossier.",
      echec: "La préparation a rencontré un problème.",
    } as const;
    const textes = {
      hors_dp: v.resume?.motifRegime ?? "",
      bloque:
        "Le plus souvent, il suffit de déplacer ou de réduire le bassin : corrigez-le et relancez, c'est gratuit. Si le point demande notre avis (secteur protégé, photos à joindre), nous revenons vers vous sous 24 h ouvrées.",
      echec: "Nous reprenons votre dossier à la main et revenons vers vous rapidement. Vous pouvez aussi le relancer.",
    } as const;
    return (
      <div role="alert" className="grid gap-5 border-l-2 border-alert py-2 pl-6">
        <p className="display text-4xl">{titres[v.statut]}</p>
        {v.resume?.echecs.length ? (
          <ul className="grid gap-2 text-[0.95rem]">
            {v.resume.echecs.map((x) => <li key={x} className="flex gap-3"><span className="mt-2.5 h-px w-4 shrink-0 bg-alert" aria-hidden="true" />{x}</li>)}
          </ul>
        ) : null}
        <p className="max-w-[60ch] leading-relaxed text-ink-2">{textes[v.statut]}</p>
        <div className="flex flex-wrap gap-3">
          {v.statut !== "hors_dp" && <Link href="/dp-piscine?reprendre=1" className="btn btn-ink">Corriger mon bassin</Link>}
          <Link href="/contact" className="btn btn-line">Nous écrire</Link>
        </div>
      </div>
    );
  }

  const r = v.resume;
  return (
    <div className="grid gap-10">
      <div className="grid gap-3">
        <p className={etiquette}>Parcelle {v.reference} · {v.commune}</p>
        <p className="display text-4xl">{v.paye ? "Votre dossier est à vous." : "Votre dossier est prêt."}</p>
        {r && (
          <p className="max-w-[64ch] leading-relaxed text-ink-2">
            {r.motifRegime.charAt(0).toUpperCase() + r.motifRegime.slice(1)}. Pièces : {r.pieces.map((p) => (p.startsWith("DPC") ? `${p.replace("DPC", "DP")} / ${p}` : p)).join(", ")} et Cerfa 16702 pré-rempli. Délai d&apos;instruction en mairie : {r.delai}.
          </p>
        )}
      </div>

      {!v.paye && (
        <div className="grid gap-4 sm:grid-cols-3">
          {v.apercus.map((src, i) => (
            <figure key={src} className="grid gap-2">
              <a href={src} target="_blank" rel="noopener noreferrer" className="block transition-transform duration-200 hover:-translate-y-0.5" aria-label={`Agrandir ${TITRES[i] ?? "l'aperçu"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Aperçu ${TITRES[i] ?? ""}`} width={1191} height={842} className="h-auto w-full border border-stone-2 bg-paper" loading="lazy" />
              </a>
              <figcaption className="text-sm text-ink-2">{TITRES[i]} · toucher pour agrandir</figcaption>
            </figure>
          ))}
        </div>
      )}

      {r && (r.aVerifier.length > 0 || r.taxe) && (
        <div className="grid gap-3 border-t border-stone-2 pt-6">
          {r.aVerifier.length > 0 && (
            <>
              <p className="font-bold">Points à vérifier de votre côté</p>
              <ul className="grid gap-1.5 text-[0.95rem] text-ink-2">{r.aVerifier.map((x) => <li key={x} className="flex gap-3"><span className="mt-2.5 h-px w-4 shrink-0 bg-brass" aria-hidden="true" />{x}</li>)}</ul>
            </>
          )}
          {r.taxe && (
            <p className="text-[0.95rem] text-ink-2">
              Taxe d&apos;aménagement estimée pour le bassin : <strong className="text-ink">≈ {euros(r.taxe.total)}</strong> (taux communaux
              à confirmer en mairie), payée après les travaux.
            </p>
          )}
        </div>
      )}

      {!v.paye && v.payable && (
        <div className="grid gap-4 bg-stone px-5 py-7 sm:px-8">
          <p className="display text-3xl">{PRIX_DP_PISCINE_TTC} € TTC</p>
          <p className="max-w-[60ch] text-[0.95rem] leading-relaxed">
            Le dossier complet, sans filigrane, prêt à déposer : plans DP1, DP2, DP3 (DPC1 à DPC3 sur le Cerfa) en PDF, Cerfa 16702 pré-rempli, et le guide pour
            le déposer en ligne ou en mairie.
          </p>
          <label className="flex cursor-pointer items-start gap-3 text-[0.95rem]">
            <input type="checkbox" className="accent-ink mt-1 h-4 w-4 shrink-0" checked={cgv} onChange={(e) => setCgv(e.target.checked)} />
            <span>J&apos;accepte les <a href="/cgv" target="_blank" rel="noopener noreferrer" className={lien}>conditions générales de vente</a> et demande l&apos;accès immédiat au dossier.</span>
          </label>
          {erreur && <p role="alert" className="text-sm text-alert">{erreur}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-ink" disabled={!cgv || paiement === "envoi"} onClick={() => void payer()}>
              {v.paiementEnCours ? "Reprendre le paiement" : paiement === "envoi" ? "Ouverture…" : "Payer et télécharger"}
            </button>
            {v.admin && (
              <button type="button" className="btn btn-line" disabled={!cgv || paiement === "envoi"} onClick={() => void payer(true)}>
                Valider sans payer (test admin)
              </button>
            )}
          </div>
          {v.paiementEnCours && (
            <p className="text-sm text-ink-2" role="status">
              Paiement ouvert dans un nouvel onglet (carte bancaire ou Apple Pay, par Qonto). Cette page se débloque dès qu&apos;il
              est reçu.{v.urlPaiement && <> <a href={v.urlPaiement} target="_blank" rel="noopener noreferrer" className={lien}>Rouvrir le paiement</a></>}
            </p>
          )}
          {v.paiementEnCours && enPause && actualiser}
        </div>
      )}

      {v.paye && p && (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-3">
            <a className="btn btn-ink" href={`/api/dp-piscine/telecharger?${new URLSearchParams({ ...p, f: "dossier" })}`}>Télécharger les plans (PDF)</a>
            <a className="btn btn-line" href={`/api/dp-piscine/telecharger?${new URLSearchParams({ ...p, f: "cerfa" })}`}>Télécharger le Cerfa 16702</a>
          </div>
          {v.guide && <pre className="max-w-[80ch] whitespace-pre-wrap border-t border-stone-2 pt-6 font-sans text-[0.95rem] leading-relaxed text-ink-2">{v.guide}</pre>}
        </div>
      )}
    </div>
  );
}
