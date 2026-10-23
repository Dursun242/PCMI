"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Etat = "repos" | "confirmer" | "envoi" | "erreur";

/**
 * Bouton de remise à zéro du compteur, en deux temps (pas de fenêtre
 * « confirm » du navigateur) : un premier clic demande confirmation.
 */
export default function RemiseAZero() {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>("repos");

  async function confirmer() {
    setEtat("envoi");
    try {
      const res = await fetch("/api/admin/express/zero", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error);
      setEtat("repos");
      router.refresh();
    } catch {
      setEtat("erreur");
    }
  }

  if (etat === "confirmer" || etat === "envoi") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-alert">Repartir de zéro ?</span>
        <button type="button" onClick={confirmer} disabled={etat === "envoi"} className="btn btn-ink text-sm !min-h-10">
          {etat === "envoi" ? "Remise à zéro…" : "Oui, remettre à zéro"}
        </button>
        <button type="button" onClick={() => setEtat("repos")} className="text-sm underline underline-offset-4">
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {etat === "erreur" && <span className="text-sm text-alert">Échec, réessayez.</span>}
      <button type="button" onClick={() => setEtat("confirmer")} className="btn btn-line text-sm !min-h-10">
        Remettre à zéro
      </button>
    </div>
  );
}
