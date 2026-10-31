"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SIGNATURE } from "@/lib/commande";

/** Intervalle de lecture du mandat pendant que le client saisit son IBAN chez Qonto. */
const INTERVALLE_SUIVI_MS = 4000;

type Etat = { etat: "attente" } | { etat: "envoi" } | { etat: "erreur"; message: string };
type PlusTard = { etat: "repos" } | { etat: "envoi" } | { etat: "envoye" } | { etat: "erreur"; message: string };

interface EtapeIbanProps {
  jeton: string;
  urlMandat: string;
  /** Appelé une fois la commande confirmée, avant de quitter le tunnel. */
  onTermine: () => void;
}

/**
 * Étape 5 : le client saisit son IBAN et valide le mandat sur la page Qonto,
 * ouverte dans un nouvel onglet (Qonto ne renvoie pas vers le site). Ici, le
 * mandat est relu toutes les quelques secondes ; dès qu'il est signé, la
 * commande (devis déjà accepté) est confirmée et les e-mails partent.
 */
export default function EtapeIban({ jeton, urlMandat, onTermine }: EtapeIbanProps) {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>({ etat: "attente" });
  const envoye = useRef(false);
  const [plusTard, setPlusTard] = useState<PlusTard>({ etat: "repos" });

  /** Pas de RIB sous la main : un e-mail avec un lien pour terminer plus tard. Le suivi du mandat continue. */
  async function terminerPlusTard() {
    setPlusTard({ etat: "envoi" });
    try {
      const res = await fetch("/api/commande/plus-tard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "L'envoi de l'e-mail a échoué.");
      setPlusTard({ etat: "envoye" });
    } catch (err) {
      setPlusTard({ etat: "erreur", message: err instanceof Error ? err.message : "L'envoi de l'e-mail a échoué." });
    }
  }

  async function finaliser() {
    if (envoye.current) return;
    envoye.current = true;
    setEtat({ etat: "envoi" });
    try {
      const res = await fetch("/api/commande/finaliser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "La confirmation de votre commande a échoué.");
      onTermine();
      router.push("/commander/confirmee");
    } catch (err) {
      envoye.current = false;
      setEtat({ etat: "erreur", message: err instanceof Error ? err.message : "La confirmation de votre commande a échoué." });
    }
  }

  useEffect(() => {
    // Après « Terminer plus tard », c'est l'onglet ouvert depuis l'e-mail qui confirmera la commande.
    if (etat.etat !== "attente" || plusTard.etat === "envoye") return;
    const controleur = new AbortController();
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/commande/statut?jeton=${encodeURIComponent(jeton)}`, { signal: controleur.signal });
        const json = await res.json();
        if (json.ok && json.signe) {
          clearInterval(id);
          finaliser();
        }
      } catch {
        /* réseau coupé ou onglet en veille : on réessaie au prochain tour */
      }
    }, INTERVALLE_SUIVI_MS);
    return () => {
      clearInterval(id);
      controleur.abort();
    };
    // finaliser ne dépend que du jeton, déjà dans les dépendances.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jeton, etat.etat, plusTard.etat]);

  return (
    <div className="grid gap-6">
      <h2 className="display text-3xl">Saisissez votre IBAN</h2>
      <p className="max-w-[60ch] text-ink-2">
        Votre devis est signé. Dernière étape : saisissez votre IBAN et validez le mandat de prélèvement sur la page
        sécurisée de notre banque, Qonto. Elle s&apos;ouvre dans un nouvel onglet ; une fois le mandat validé,{" "}
        <strong className="text-ink">revenez sur cette page</strong> : votre commande est aussitôt confirmée.
      </p>
      <div>
        <a href={urlMandat} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
          Saisir mon IBAN sur la page sécurisée Qonto
        </a>
      </div>

      <p role="status" className="flex items-center gap-3 text-sm text-ink-2">
        {etat.etat === "envoi" ? (
          <>
            <span className="numeral text-bronze">✓</span> Mandat validé. Confirmation de votre commande…
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
          <button type="button" className="mt-2 underline underline-offset-2" onClick={finaliser}>
            Réessayer
          </button>
        </div>
      )}

      <p className="text-sm text-ink-2">Rien n&apos;est prélevé aujourd&apos;hui : le mandat autorise seulement les prélèvements futurs, après validation de votre projet.</p>

      <div className="border-t border-stone-2 pt-6">
        {plusTard.etat === "envoye" ? (
          <div role="status" className="border-l-2 border-brass pl-4 text-sm text-ink">
            <p>
              C&apos;est noté. Nous venons de vous envoyer un e-mail avec un lien pour saisir votre IBAN quand vous voulez,
              valable {SIGNATURE.validiteJours} jours. Votre devis reste signé ; rien n&apos;est prélevé. Vous pouvez fermer cette page.
            </p>
            <button type="button" className="mt-2 underline underline-offset-2" onClick={() => setPlusTard({ etat: "repos" })}>
              J&apos;ai finalement mon RIB
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-2">Vous n&apos;avez pas votre RIB sous la main ?</p>
            <button
              type="button"
              className="btn btn-line mt-3"
              onClick={terminerPlusTard}
              disabled={plusTard.etat === "envoi"}
            >
              {plusTard.etat === "envoi" ? "Envoi…" : "Terminer plus tard par e-mail"}
            </button>
            {plusTard.etat === "erreur" && <p role="alert" className="mt-3 text-sm text-alert">{plusTard.message}</p>}
          </>
        )}
      </div>
    </div>
  );
}
