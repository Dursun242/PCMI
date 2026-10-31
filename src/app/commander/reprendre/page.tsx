import type { Metadata } from "next";
import Link from "next/link";
import RepriseCommande from "@/components/commande/RepriseCommande";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { lireMandat } from "@/lib/qonto";
import { ouvrirQonto } from "@/lib/qontoConnexion";

/**
 * Lien de l'e-mail « il ne manque que votre IBAN » : la commande (devis déjà
 * signé) est rendue au tunnel, qui reprend à l'étape IBAN.
 */
export const metadata: Metadata = {
  title: "Terminer votre commande",
  description: "Saisissez votre IBAN pour confirmer votre commande de permis de construire.",
  robots: { index: false, follow: false },
  // Le jeton de l'adresse porte les coordonnées du client : il ne doit jamais partir vers un autre site.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function ReprendrePage({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const { jeton } = await searchParams;
  const signable = commandeDuJeton(jeton);

  let urlMandat: string | undefined;
  if (signable?.donnees.acceptation && jeton) {
    try {
      // Mandat déjà signé : pas de page de signature, le tunnel confirmera aussitôt la commande.
      urlMandat = (await lireMandat(await ouvrirQonto(), signable.donnees.mandatId)).urlSignature ?? "";
    } catch (err) {
      console.error("[commande/reprendre] lecture du mandat échouée", err);
    }
  }

  if (!jeton || urlMandat === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
        <h1 className="display text-5xl">Ce lien n&apos;est plus valable.</h1>
        <p className="lead mt-6">Il a expiré ou il est incomplet. Recommencez votre commande : cela ne prend que quelques minutes.</p>
        <p className="mt-8"><Link href="/commander" className="btn btn-ink">Recommencer ma commande</Link></p>
      </div>
    );
  }
  return <RepriseCommande jeton={jeton} urlMandat={urlMandat} />;
}
