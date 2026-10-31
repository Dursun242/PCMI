"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import { estTunnelCommande } from "@/lib/commande";
import Logo from "@/components/Logo";

/**
 * Cadre réduit du tunnel de commande : un client qui s'engage n'a pas besoin
 * du menu, du bandeau promotionnel ni des dizaines de liens du pied de page,
 * qui sont autant de sorties. Restent le logo (retour à l'accueil), le
 * téléphone et les liens légaux obligatoires.
 */
export function SelonTunnel({ tunnel, ailleurs }: { tunnel: ReactNode; ailleurs: ReactNode }) {
  return <>{estTunnelCommande(usePathname()) ? tunnel : ailleurs}</>;
}

export function EnTeteCommande() {
  return (
    <header className="border-b border-stone-2 bg-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label={`${site.name}, retour à l'accueil`}>
          <Logo priority compact />
        </Link>
        {site.phone && (
          <a
            href={`tel:${site.phone.replace(/\s/g, "")}`}
            aria-label={`Une question ? Appelez le ${site.phone}`}
            className="shrink-0 text-right text-sm leading-tight text-ink-2"
          >
            {/* Sur téléphone, « Permis en ligne » occupe la place : un lien court suffit. */}
            <strong className="text-ink underline decoration-brass underline-offset-2 sm:hidden">Appeler</strong>
            <span className="hidden sm:inline">
              Une question ? <strong className="numeral whitespace-nowrap text-ink">{site.phone}</strong>
            </span>
          </a>
        )}
      </div>
    </header>
  );
}

export function PiedCommande() {
  return (
    <footer className="border-t border-stone-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 text-xs text-ink-2 sm:px-8">
        <span>© {new Date().getFullYear()} {site.legal.company}</span>
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/mentions-legales" className="hover:text-ink">Mentions légales</Link>
          <Link href="/cgv" className="hover:text-ink">Conditions générales de vente</Link>
          <Link href="/confidentialite" className="hover:text-ink">Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
