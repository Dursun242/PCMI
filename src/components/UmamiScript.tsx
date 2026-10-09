"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Mesure d'audience Umami, sans cookie. Le compte Umami gratuit n'accepte qu'un site :
 * on réutilise celui d'ID Maîtrise et on distingue ce site par son domaine et
 * l'étiquette « permis-maison-individuelle » (filtres Hostname et Tag dans Umami).
 * Pages vues envoyées à la main pour exclure l'espace admin ; rien n'est mesuré
 * hors du domaine de production (prévisualisations, poste local).
 */
const UMAMI_ID = "abda64d1-0cfd-4629-837b-a387f96af946";

export default function UmamiScript() {
  const path = usePathname();
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (pret && !path.startsWith("/admin")) window.umami?.track();
  }, [pret, path]);

  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={UMAMI_ID}
      data-tag="permis-maison-individuelle"
      data-domains="permis-maison-individuelle.fr,www.permis-maison-individuelle.fr"
      data-auto-track="false"
      data-do-not-track="true"
      strategy="afterInteractive"
      onReady={() => setPret(true)}
    />
  );
}
