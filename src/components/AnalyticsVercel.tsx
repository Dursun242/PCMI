"use client";

import { Analytics } from "@vercel/analytics/next";
import { sansMesureTierce } from "@/lib/mesureTierce";

/**
 * Vercel Web Analytics (sans cookie ni identifiant individuel), sauf sur l'admin et le parcours DP piscine
 * (lib/mesureTierce.ts) : leurs pages vues et événements ne sont pas envoyés.
 */
export default function AnalyticsVercel() {
  return (
    <Analytics
      beforeSend={(e) => {
        try {
          return sansMesureTierce(new URL(e.url).pathname) ? null : e;
        } catch {
          return e;
        }
      }}
    />
  );
}
