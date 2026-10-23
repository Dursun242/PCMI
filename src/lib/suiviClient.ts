/**
 * Côté navigateur : envoie un événement au compteur de /permis-express.
 * Ne fait rien ailleurs sur le site, ce qui permet de l'appeler depuis des
 * composants partagés (lien téléphone, lien WhatsApp).
 */
import { trancheTemps, type TypeSuivi } from "./suivi";

const CLE_ADS = "pcmi_express_ads";

/** La visite vient-elle d'une annonce ? Mémorisé pour la session : le gclid peut disparaître de l'URL. */
export function visiteAds(): boolean {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("gclid") || p.get("utm_source") === "google") sessionStorage.setItem(CLE_ADS, "1");
    return sessionStorage.getItem(CLE_ADS) === "1";
  } catch {
    return false;
  }
}

export function suivreExpress(type: Exclude<TypeSuivi, "demande" | "demande-urgente">) {
  if (window.location.pathname !== "/permis-express") return;
  envoyer(type);
}

/**
 * Temps passé, envoyé par ExpressVue en quittant la page. Sans contrôle de
 * l'adresse : après l'envoi du formulaire, elle est déjà celle de la page merci.
 */
export function suivreTemps(ms: number) {
  envoyer(trancheTemps(ms));
}

function envoyer(type: TypeSuivi) {
  try {
    const corps = JSON.stringify({ type, ads: visiteAds() });
    // sendBeacon survit à l'ouverture de l'appli Téléphone ou WhatsApp, contrairement à fetch.
    if (!navigator.sendBeacon?.("/api/express/suivi", corps)) {
      void fetch("/api/express/suivi", { method: "POST", body: corps, keepalive: true });
    }
  } catch {
    /* la mesure ne doit jamais casser un parcours */
  }
}
