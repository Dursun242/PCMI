import Link from "next/link";
import Logo from "./Logo";
import TelLink from "./TelLink";
import { site } from "@/config/site";

/**
 * En-tête et pied propres à /permis-express, à la place de ceux du site
 * (masqués par le layout sur cette page) : le visiteur venu d'une annonce n'a
 * que deux sorties, appeler ou demander son devis. Restent les liens légaux.
 */
export function ExpressEntete() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper/10 bg-forest text-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Logo light priority compact />
        <TelLink source="express_entete" className="btn btn-paper !min-h-10 shrink-0 whitespace-nowrap !px-4 text-sm">
          <span className="sm:hidden">Appeler</span>
          <span className="hidden sm:inline">{site.phone}</span>
        </TelLink>
      </div>
    </header>
  );
}

export function ExpressPied() {
  return (
    <footer className="border-t border-paper/10 bg-forest pb-24 text-sm text-paper/70 md:pb-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        <p>
          {site.legal.company} · {site.address.street}, {site.address.zip} {site.address.city}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li><Link href="/mentions-legales" className="hover:text-paper">Mentions légales</Link></li>
          <li><Link href="/cgv" className="hover:text-paper">CGV</Link></li>
          <li><Link href="/confidentialite" className="hover:text-paper">Confidentialité</Link></li>
        </ul>
      </div>
    </footer>
  );
}
