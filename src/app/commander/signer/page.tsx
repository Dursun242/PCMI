import type { Metadata } from "next";
import Link from "next/link";
import SignatureCommande from "@/components/commande/SignatureCommande";
import { formatCentimes, mentionFacturation } from "@/lib/commande";
import { commandeDuJeton } from "@/lib/commandeServeur";
import { formatEuro } from "@/lib/format";
import { configQonto, lireDevis, lireMandat } from "@/lib/qonto";

/**
 * Page ouverte depuis l'e-mail « Confirmez votre commande » : le client relit
 * son devis, l'échéancier, le mandat et les CGV, puis signe. Tout est relu à
 * la source (jeton signé, devis et mandat chez Qonto) à chaque affichage.
 */
export const metadata: Metadata = {
  title: "Signer votre commande",
  description: "Relisez votre devis, votre échéancier et les conditions générales de vente, puis signez votre commande.",
  robots: { index: false, follow: false },
  // Le jeton de l'adresse porte les coordonnées du client : il ne doit jamais partir vers un autre site.
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

const ETAPES_FAITES = ["Panier", "Coordonnées", "Règlement", "IBAN"];

function Message({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <h1 className="display text-5xl">{titre}</h1>
      <div className="lead mt-6 grid gap-4">{children}</div>
    </div>
  );
}

export default async function SignerPage({ searchParams }: { searchParams: Promise<{ jeton?: string }> }) {
  const { jeton } = await searchParams;
  const signable = commandeDuJeton(jeton);
  const cfg = configQonto();
  if (!signable || !cfg || !jeton) {
    return (
      <Message titre="Ce lien n'est plus valable.">
        <p>Il a expiré ou il est incomplet. Recommencez votre commande : cela ne prend que quelques minutes.</p>
        <p><Link href="/commander" className="btn btn-ink">Recommencer ma commande</Link></p>
      </Message>
    );
  }

  let devis, mandat;
  try {
    [devis, mandat] = await Promise.all([lireDevis(cfg, signable.donnees.devisId), lireMandat(cfg, signable.donnees.mandatId)]);
  } catch (err) {
    console.error("[commande/signer] lecture Qonto échouée", err);
    return (
      <Message titre="Votre commande est momentanément indisponible.">
        <p>Réessayez dans quelques minutes depuis le lien de votre e-mail.</p>
      </Message>
    );
  }

  if (!mandat.signe) {
    return (
      <Message titre="Votre mandat n'est pas encore validé.">
        <p>Saisissez votre IBAN et validez le mandat de prélèvement sur la page sécurisée Qonto, puis revenez sur ce lien.</p>
        {mandat.urlSignature && (
          <p><a href={mandat.urlSignature} className="btn btn-ink">Saisir mon IBAN</a></p>
        )}
      </Message>
    );
  }

  const { commande } = signable;
  const { coordonnees: c, echeancier, panier } = commande;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 sm:py-24">
      <p className="text-sm text-ink-2">
        {ETAPES_FAITES.map((e) => (
          <span key={e}>
            <span className="numeral text-bronze">✓</span> {e} ·{" "}
          </span>
        ))}
        <strong className="text-ink">05 Signature</strong>
      </p>
      <h1 className="display mt-7 text-5xl sm:text-6xl">Signez votre commande.</h1>
      <p className="lead mt-6">
        Relisez votre commande, {c.prenom}. Rien n&apos;est prélevé à la signature : nous vérifions d&apos;abord que votre
        terrain permet le dépôt du permis.
      </p>

      <section className="mt-10 border border-ink bg-paper p-6" aria-label="Votre commande">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-bronze">Devis n° {devis.numero}</p>
        <ul className="mt-4 grid gap-2 text-sm">
          {panier.lignes.map((l) => (
            <li key={l.libelle} className="flex justify-between gap-4">
              <span>{l.quantite > 1 ? `${l.quantite} × ${l.libelle}` : l.libelle}</span>
              <span className="numeral">{formatEuro(l.totalTTC)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-stone-2 pt-4 font-bold">
          <span>Total TTC</span>
          <span className="numeral text-xl">{formatCentimes(panier.totalTTC * 100)}</span>
        </div>
        <p className="mt-4 border-l-2 border-brass pl-4 text-sm">{mentionFacturation(echeancier)}</p>
        <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <dt className="font-bold">Terrain</dt>
          <dd>{c.terrainAdresse}, {c.terrainCodePostal} {c.terrainCommune}</dd>
          <dt className="font-bold">Mandat SEPA</dt>
          <dd>Réf. {mandat.reference} · IBAN {mandat.iban}</dd>
        </dl>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href={devis.url} target="_blank" rel="noopener noreferrer" className="underline decoration-brass underline-offset-2">Voir le devis complet (PDF)</a>
          <Link href="/cgv" target="_blank" className="underline decoration-brass underline-offset-2">Lire les conditions générales de vente</Link>
        </p>
      </section>

      <div className="mt-10">
        <SignatureCommande jeton={jeton} />
      </div>
    </div>
  );
}
