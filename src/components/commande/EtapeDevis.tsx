"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { DELAI_RETRACTATION_JOURS, type Prelevement } from "@/lib/commande";
import type { Devis } from "@/lib/qonto";
import { DevisVisuel, EcheancierTable } from "./DevisVisuel";

type Chargement =
  | { etat: "chargement" }
  | { etat: "pret"; devis: Devis; prelevements: Prelevement[] }
  | { etat: "erreur"; message: string };

type Envoi = { etat: "repos" } | { etat: "envoi" } | { etat: "erreur"; message: string };

interface EtapeDevisProps {
  jeton: string;
  /** Appelé avec le nouveau jeton, porteur de la preuve d'acceptation. */
  onAccepte: (jeton: string) => void;
}

/**
 * Étape 4 : le client relit son devis (tel que Qonto l'a établi) et
 * l'échéancier, puis l'accepte avec les CGV. C'est la signature électronique
 * de la commande ; reste ensuite le mandat de prélèvement chez Qonto.
 */
export default function EtapeDevis({ jeton, onAccepte }: EtapeDevisProps) {
  const [chargement, setChargement] = useState<Chargement>({ etat: "chargement" });
  const [accepte, setAccepte] = useState(false);
  const [executionAnticipee, setExecutionAnticipee] = useState(false);
  const [envoi, setEnvoi] = useState<Envoi>({ etat: "repos" });

  useEffect(() => {
    const controleur = new AbortController();
    fetch(`/api/commande/devis?jeton=${encodeURIComponent(jeton)}`, { signal: controleur.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error ?? "Votre devis est momentanément indisponible.");
        setChargement({ etat: "pret", devis: json.devis, prelevements: json.prelevements });
      })
      .catch((err) => {
        if (controleur.signal.aborted) return;
        setChargement({ etat: "erreur", message: err instanceof Error ? err.message : "Votre devis est momentanément indisponible." });
      });
    return () => controleur.abort();
  }, [jeton]);

  async function accepter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepte) return;
    setEnvoi({ etat: "envoi" });
    try {
      const res = await fetch("/api/commande/accepter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, accepte: true, executionAnticipee }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "L'acceptation a échoué.");
      onAccepte(json.jeton);
    } catch (err) {
      setEnvoi({ etat: "erreur", message: err instanceof Error ? err.message : "L'acceptation a échoué." });
    }
  }

  if (chargement.etat === "chargement") {
    return (
      <p role="status" className="flex items-center gap-3 text-ink-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-bronze" aria-hidden="true" /> Préparation de votre devis…
      </p>
    );
  }
  if (chargement.etat === "erreur") {
    return <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{chargement.message}</p>;
  }

  const { devis, prelevements } = chargement;
  return (
    <div className="grid gap-10">
      <div>
        <DevisVisuel devis={devis} />
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href={devis.url} target="_blank" rel="noopener noreferrer" className="underline decoration-brass underline-offset-2">Ouvrir le devis officiel (PDF)</a>
          <Link href="/cgv" target="_blank" className="underline decoration-brass underline-offset-2">Lire les conditions générales de vente</Link>
        </p>
      </div>

      <EcheancierTable prelevements={prelevements} />

      <form onSubmit={accepter} className="grid gap-5">
        <label className="flex items-start gap-3 text-ink">
          <input type="checkbox" required checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-1 accent-ink h-4 w-4" />
          <span>
            J&apos;ai lu et j&apos;accepte le devis, l&apos;échéancier et les{" "}
            <Link href="/cgv" target="_blank" className="underline decoration-brass underline-offset-2">conditions générales de vente</Link>.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-ink-2">
          <input type="checkbox" checked={executionAnticipee} onChange={(e) => setExecutionAnticipee(e.target.checked)} className="mt-1 accent-ink h-4 w-4" />
          <span>
            Facultatif : je demande que la prestation commence avant la fin du délai de rétractation de {DELAI_RETRACTATION_JOURS} jours,
            et je reconnais perdre mon droit de rétractation une fois la prestation intégralement exécutée (CGV, article 8).
          </span>
        </label>

        {envoi.etat === "erreur" && <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{envoi.message}</p>}

        <div>
          <button type="submit" className="btn btn-ink" disabled={!accepte || envoi.etat === "envoi"}>
            {envoi.etat === "envoi" ? "Signature…" : "J'accepte et je signe mon devis"}
          </button>
        </div>
        <p className="text-xs text-ink-2">
          En cliquant, vous signez électroniquement votre devis. Dernière étape ensuite : votre IBAN, sur la page sécurisée de
          notre banque. Rien n&apos;est prélevé aujourd&apos;hui.
        </p>
      </form>
    </div>
  );
}
