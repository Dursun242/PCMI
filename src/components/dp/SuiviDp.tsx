"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { PRIX_DP_PISCINE_TTC } from "@/lib/dpPiscine";

interface Vue {
  ok: boolean;
  error?: string;
  statut: "en_cours" | "pret" | "a_verifier" | "bloque" | "hors_dp" | "echec";
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
const TITRES = ["DP1 · Plan de situation", "DP2 · Plan de masse", "DP3 · Plan en coupe"];

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

  // On interroge le serveur tant que le dossier se prépare ou qu'un paiement est en cours.
  const attendre = v?.statut === "en_cours" || Boolean(v?.paiementEnCours);
  useEffect(() => {
    if (!attendre) return;
    const t = setInterval(() => void charger(), 5000);
    return () => clearInterval(t);
  }, [attendre, charger]);

  useEffect(() => {
    if (v && v.statut !== "en_cours") trackEvent("dp_piscine_apercu", { statut: v.statut });
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
        trackEvent("dp_piscine_payer", {});
        window.open(json.url, "_blank", "noopener");
        await charger();
      } else {
        trackEvent("dp_piscine_paye", {});
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
          Plan de situation, plan de masse coté, plan en coupe et Cerfa 13703 : comptez 3 minutes. Cette page se met à jour toute
          seule ; vous pouvez aussi la fermer, le lien est dans votre e-mail.
        </p>
        <div className="h-1 w-full max-w-md overflow-hidden bg-stone-2"><div className="h-full w-1/3 animate-pulse bg-brass" /></div>
      </div>
    );
  }

  if (v.statut === "echec" || v.statut === "bloque" || v.statut === "hors_dp") {
    const titre = v.statut === "hors_dp" ? "Pas de déclaration préalable pour ce projet." : "Votre dossier demande une vérification.";
    const texte =
      v.statut === "hors_dp"
        ? v.resume?.motifRegime
        : "Votre terrain demande un regard de notre bureau d'études (secteur protégé, photos à joindre, recul à confirmer…). Nous revenons vers vous sous 24 h ouvrées. Rien n'est à régler pour le moment.";
    return (
      <div role="alert" className="grid gap-4 border-l-2 border-alert py-2 pl-6">
        <p className="display text-4xl">{titre}</p>
        <p className="max-w-[60ch] leading-relaxed text-ink-2">{texte}</p>
        {v.resume?.echecs.length ? <ul className="list-disc pl-5 text-sm text-ink-2">{v.resume.echecs.map((x) => <li key={x}>{x}</li>)}</ul> : null}
        <div><Link href="/contact" className="btn btn-line">Nous écrire</Link></div>
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
            {r.motifRegime.charAt(0).toUpperCase() + r.motifRegime.slice(1)}. Pièces : {r.pieces.join(", ")} et Cerfa 13703 pré-rempli. Délai d&apos;instruction en mairie : {r.delai}.
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
            Le dossier complet, sans filigrane, prêt à déposer : plans DP1, DP2, DP3 en PDF, Cerfa 13703 pré-rempli, et le guide pour
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
        </div>
      )}

      {v.paye && p && (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-3">
            <a className="btn btn-ink" href={`/api/dp-piscine/telecharger?${new URLSearchParams({ ...p, f: "dossier" })}`}>Télécharger les plans (PDF)</a>
            <a className="btn btn-line" href={`/api/dp-piscine/telecharger?${new URLSearchParams({ ...p, f: "cerfa" })}`}>Télécharger le Cerfa 13703</a>
          </div>
          {v.guide && <pre className="max-w-[80ch] whitespace-pre-wrap border-t border-stone-2 pt-6 font-sans text-[0.95rem] leading-relaxed text-ink-2">{v.guide}</pre>}
        </div>
      )}
    </div>
  );
}
