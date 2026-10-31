"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Intervalle de lecture du mandat pendant que le client saisit son IBAN chez Qonto. */
const INTERVALLE_SUIVI_MS = 4000;

type Etat = { etat: "attente" } | { etat: "envoi" } | { etat: "erreur"; message: string };

interface EtapeIbanProps {
  jeton: string;
  urlMandat: string;
  /** Appelé une fois l'e-mail de signature envoyé, avant de quitter le tunnel. */
  onTermine: () => void;
}

/**
 * Étape 4 : le client saisit son IBAN et valide le mandat sur la page Qonto,
 * ouverte dans un nouvel onglet (Qonto ne renvoie pas vers le site). Ici, le
 * mandat est relu toutes les quelques secondes ; dès qu'il est signé, le site
 * envoie l'e-mail de signature de la commande et passe à la page suivante.
 */
export default function EtapeIban({ jeton, urlMandat, onTermine }: EtapeIbanProps) {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>({ etat: "attente" });
  const envoye = useRef(false);

  async function envoyerLien() {
    if (envoye.current) return;
    envoye.current = true;
    setEtat({ etat: "envoi" });
    try {
      const res = await fetch("/api/commande/lien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "L'envoi de l'e-mail a échoué.");
      onTermine();
      router.push("/commander/email-envoye");
    } catch (err) {
      envoye.current = false;
      setEtat({ etat: "erreur", message: err instanceof Error ? err.message : "L'envoi de l'e-mail a échoué." });
    }
  }

  useEffect(() => {
    if (etat.etat !== "attente") return;
    const controleur = new AbortController();
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/commande/statut?jeton=${encodeURIComponent(jeton)}`, { signal: controleur.signal });
        const json = await res.json();
        if (json.ok && json.signe) {
          clearInterval(id);
          envoyerLien();
        }
      } catch {
        /* réseau coupé ou onglet en veille : on réessaie au prochain tour */
      }
    }, INTERVALLE_SUIVI_MS);
    return () => {
      clearInterval(id);
      controleur.abort();
    };
    // envoyerLien ne dépend que du jeton, déjà dans les dépendances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jeton, etat.etat]);

  return (
    <div className="grid gap-6">
      <h2 className="display text-3xl">Saisissez votre IBAN</h2>
      <p className="max-w-[60ch] text-ink-2">
        Votre commande est prête. Saisissez votre IBAN et validez le mandat de prélèvement sur la page sécurisée de notre
        banque, Qonto. Elle s&apos;ouvre dans un nouvel onglet ; une fois le mandat validé, <strong className="text-ink">revenez sur cette page</strong> :
        nous vous envoyons aussitôt l&apos;e-mail pour signer votre commande.
      </p>
      <div>
        <a href={urlMandat} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
          Saisir mon IBAN sur la page sécurisée Qonto
        </a>
      </div>

      <p role="status" className="flex items-center gap-3 text-sm text-ink-2">
        {etat.etat === "envoi" ? (
          <>
            <span className="numeral text-bronze">✓</span> Mandat validé. Envoi de l&apos;e-mail de signature…
          </>
        ) : etat.etat === "attente" ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-bronze" aria-hidden="true" /> En attente de la validation de
            votre mandat…
          </>
        ) : null}
      </p>

      {etat.etat === "erreur" && (
        <div role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">
          <p>{etat.message}</p>
          <button type="button" className="mt-2 underline underline-offset-2" onClick={envoyerLien}>
            Réessayer
          </button>
        </div>
      )}

      <p className="text-sm text-ink-2">Rien n&apos;est prélevé aujourd&apos;hui : le mandat autorise seulement les prélèvements futurs, après validation de votre projet.</p>
    </div>
  );
}
