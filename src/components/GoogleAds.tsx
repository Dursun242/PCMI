"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { CONSENT_KEY, GADS_ID, OPEN_CONSENT_EVENT, isProductionHost, setAdsConsent } from "@/lib/googleAds";

/**
 * Balise Google Ads + bannière de consentement.
 *
 * Consent Mode v2 : tout est refusé par défaut, la bannière s'affiche tant
 * qu'aucun choix n'est fait, et le choix reste modifiable depuis la page
 * Confidentialité (événement OPEN_CONSENT_EVENT). Rien n'est chargé hors du
 * domaine de production ni dans l'espace admin.
 *
 * Les conversions elles-mêmes partent de lib/analytics.ts (trackEvent) ; ce
 * composant ajoute seulement la mesure des clics sur les liens tel:.
 */
const CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var c=null;try{c=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});}catch(e){}
var g=c==="granted"?"granted":"denied";
gtag("consent","default",{ad_storage:g,ad_user_data:g,ad_personalization:g,analytics_storage:"denied",wait_for_update:500});
gtag("set","ads_data_redaction",true);gtag("set","url_passthrough",true);
gtag("js",new Date());gtag("config",${JSON.stringify(GADS_ID)});`;

export default function GoogleAds() {
  const path = usePathname();
  const [actif, setActif] = useState(false);
  const [banniere, setBanniere] = useState(false);

  useEffect(() => {
    if (!isProductionHost()) return;
    setActif(true);
    let choix: string | null = null;
    try {
      choix = localStorage.getItem(CONSENT_KEY);
    } catch {
      /* stockage bloqué : on redemande */
    }
    if (!choix) setBanniere(true);

    const ouvrir = () => setBanniere(true);
    const clicTel = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='tel:']");
      if (a) trackEvent("phone_click", { source: window.location.pathname });
    };
    window.addEventListener(OPEN_CONSENT_EVENT, ouvrir);
    document.addEventListener("click", clicTel, { capture: true });
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, ouvrir);
      document.removeEventListener("click", clicTel, { capture: true });
    };
  }, []);

  if (!actif || path.startsWith("/admin")) return null;

  const choisir = (ok: boolean) => {
    setAdsConsent(ok);
    setBanniere(false);
  };

  return (
    <>
      <Script id="gads-consent" strategy="afterInteractive">
        {CONSENT_DEFAULT}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`} strategy="afterInteractive" />
      {banniere && (
        <div
          role="dialog"
          aria-label="Cookies"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-ink bg-paper/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:px-8 sm:py-3"
        >
          {/* Compact : le bandeau ne doit pas masquer la page. Refuser reste aussi visible qu'Accepter (CNIL). */}
          <div className="mx-auto flex max-w-5xl items-center gap-3 text-xs text-ink-2 sm:text-sm">
            <p className="leading-snug">
              Cookies : mesure de nos annonces Google.{" "}
              <a href="/confidentialite" className="text-ink underline decoration-brass underline-offset-2">
                En savoir plus
              </a>
            </p>
            <div className="flex shrink-0 gap-1.5 sm:gap-2">
              <button type="button" onClick={() => choisir(true)} className="btn btn-ink !min-h-9 !px-3 text-xs sm:!px-5 sm:text-sm">
                Accepter
              </button>
              <button type="button" onClick={() => choisir(false)} className="btn btn-line !min-h-9 !px-3 text-xs sm:!px-5 sm:text-sm">
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Bouton « Gérer les cookies » (page Confidentialité). */
export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      Modifier mon choix sur les cookies
    </button>
  );
}
