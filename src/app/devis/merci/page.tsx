import type { Metadata } from "next";
import MerciContent from "@/components/MerciContent";

/**
 * Confirmation sans précision de formule.
 *
 * Conservée pour les liens déjà partagés et comme filet en cas d'envoi dont le
 * type n'est pas reconnu. Les formulaires, eux, redirigent vers
 * /devis/merci/{type} : c'est ce segment qui rend la répartition des demandes
 * lisible dans l'onglet Pages de Vercel Web Analytics.
 */
export const metadata: Metadata = {
  title: "Votre demande est bien reçue",
  description: "Confirmation de votre demande de devis de permis de construire.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/devis/merci" },
};

export default function MerciPage() {
  return <MerciContent />;
}
