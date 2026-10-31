"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DELAI_RETRACTATION_JOURS } from "@/lib/commande";

type Etat = { etat: "repos" } | { etat: "envoi" } | { etat: "erreur"; message: string };

/** Cases à cocher et bouton « Je signe ma commande » : la signature électronique simple du devis, des CGV et de l'échéancier. */
export default function SignatureCommande({ jeton }: { jeton: string }) {
  const router = useRouter();
  const [accepte, setAccepte] = useState(false);
  const [executionAnticipee, setExecutionAnticipee] = useState(false);
  const [etat, setEtat] = useState<Etat>({ etat: "repos" });

  async function signer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accepte) return;
    setEtat({ etat: "envoi" });
    try {
      const res = await fetch("/api/commande/signer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, accepte: true, executionAnticipee }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "La signature a échoué.");
      router.push("/commander/confirmee");
    } catch (err) {
      setEtat({ etat: "erreur", message: err instanceof Error ? err.message : "La signature a échoué." });
    }
  }

  return (
    <form onSubmit={signer} className="grid gap-5">
      <label className="flex items-start gap-3 text-ink">
        <input type="checkbox" required checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-1 accent-ink h-4 w-4" />
        <span>
          J&apos;ai lu et j&apos;accepte le devis, l&apos;échéancier de facturation et les{" "}
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

      {etat.etat === "erreur" && (
        <p role="alert" className="border-l-2 border-alert pl-4 text-sm text-alert">{etat.message}</p>
      )}

      <div>
        <button type="submit" className="btn btn-ink" disabled={!accepte || etat.etat === "envoi"}>
          {etat.etat === "envoi" ? "Signature en cours…" : "Je signe ma commande"}
        </button>
      </div>
      <p className="text-xs text-ink-2">
        En cliquant, vous signez électroniquement votre commande. Vous recevez aussitôt par e-mail le devis signé, les
        conditions générales de vente et le formulaire de rétractation.
      </p>
    </form>
  );
}
