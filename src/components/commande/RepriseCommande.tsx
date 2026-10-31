"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ecrireCommandeEnCours } from "./commandeEnCours";

/** Rend la commande au tunnel (devis accepté) et y retourne : il reprend à l'étape IBAN. */
export default function RepriseCommande({ jeton, urlMandat }: { jeton: string; urlMandat: string }) {
  const router = useRouter();
  useEffect(() => {
    ecrireCommandeEnCours({ jeton, urlMandat, accepte: true });
    router.replace("/commander");
  }, [jeton, urlMandat, router]);
  return (
    <p role="status" className="mx-auto max-w-3xl px-5 py-24 text-ink-2 sm:px-8">
      Reprise de votre commande…
    </p>
  );
}
