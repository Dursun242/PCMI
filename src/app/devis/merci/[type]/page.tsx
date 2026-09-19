import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MerciContent, { MERCI_TYPES, isMerciType } from "@/components/MerciContent";

/**
 * Confirmation d'envoi, une page par type de demande.
 *
 * Le type voyage dans le chemin — /devis/merci/complet — et non dans un
 * paramètre d'URL : Vercel Web Analytics ne compte que des pages sur les plans
 * gratuits, les événements personnalisés étant réservés aux plans payants.
 * Chaque formule devient ainsi une ligne lisible de l'onglet Pages.
 *
 * Les segments sont figés : un chemin inconnu renvoie une 404 plutôt que de
 * polluer les statistiques avec des pages fabriquées de toutes pièces.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return MERCI_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return {
    title: "Votre demande est bien reçue",
    description: "Confirmation de votre demande de devis de permis de construire.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/devis/merci/${type}` },
  };
}

export default async function MerciTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isMerciType(type)) notFound();
  return <MerciContent type={type} />;
}
