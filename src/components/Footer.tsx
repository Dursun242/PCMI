import Link from "next/link";
import { site } from "@/config/site";
import Logo from "./Logo";

/**
 * Pied de page en forme de cartouche de planche PCMI, sur fond vert profond.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const label = "text-[0.68rem] font-bold uppercase tracking-[0.2em] text-brass-2 mb-3";

  return (
    <footer className="mt-28 bg-forest text-paper">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-brass/40 text-sm">
          <div className="p-6 border-b sm:border-r border-brass/40 lg:border-b-0">
            <div className={label}>Maître d&apos;œuvre</div>
            <Logo light />
            <p className="mt-4 text-paper/70 leading-relaxed">
              {site.legal.company}
              <br />
              {site.address.street}
              <br />
              {site.address.zip} {site.address.city}
            </p>
          </div>

          <div className="p-6 border-b border-brass/40 lg:border-r lg:border-b-0">
            <div className={label}>Contact</div>
            <a href={`mailto:${site.email}`} className="hover:text-brass-2 break-all">
              {site.email}
            </a>
            {site.phone && (
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="block mt-1 hover:text-brass-2">
                {site.phone}
              </a>
            )}
            <p className="mt-4 text-paper/70 leading-relaxed">
              Réponse sous 48 h ouvrées.
              <br />
              Intervention partout en France.
            </p>
          </div>

          <div className="p-6 border-b sm:border-r border-brass/40 sm:border-b-0">
            <div className={label}>Plan du site</div>
            <ul className="grid gap-2">
              <li><Link href="/tarifs" className="hover:text-brass-2">Formules et tarifs</Link></li>
              <li><Link href="/permis-de-construire-maison" className="hover:text-brass-2">Le guide du permis</Link></li>
              <li><Link href="/conseils" className="hover:text-brass-2">Conseils</Link></li>
              <li><Link href="/devis" className="hover:text-brass-2">Demander un devis</Link></li>
              <li><Link href="/dossier" className="hover:text-brass-2">Fiche projet complète</Link></li>
              <li><Link href="/contact" className="hover:text-brass-2">Contact</Link></li>
              <li><a href={site.parentUrl} className="hover:text-brass-2" rel="noopener">Site {site.parent}</a></li>
            </ul>
          </div>

          <div className="p-6">
            <div className={label}>Indice</div>
            <table className="w-full text-paper/70">
              <tbody>
                <tr><td className="pr-3 py-0.5">Échelle</td><td className="text-paper">1 / 100</td></tr>
                <tr><td className="pr-3 py-0.5">Émission</td><td className="text-paper">{year}</td></tr>
                <tr><td className="pr-3 py-0.5">Phase</td><td className="text-paper">PC</td></tr>
              </tbody>
            </table>
            <ul className="mt-4 grid gap-1 text-xs text-paper/70">
              <li><Link href="/mentions-legales" className="hover:text-brass-2">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-brass-2">Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs text-paper/50">
          © {year} {site.legal.company}. {site.name} est l&apos;offre permis de construire de {site.parent}, bureau de maîtrise d&apos;œuvre au Havre.
        </p>
      </div>
    </footer>
  );
}
