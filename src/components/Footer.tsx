import Link from "next/link";
import { site } from "@/config/site";
import Logo from "./Logo";

/**
 * Pied de page en forme de cartouche de planche PCMI, sur fond vert profond.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const label = "text-[0.68rem] font-bold uppercase tracking-[0.2em] text-brass-2 mb-4";

  return (
    <footer className="mt-28 border-t-2 border-brass bg-forest text-paper">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 pb-10">
        <div className="flex flex-col gap-6 pb-12 md:flex-row md:items-end md:justify-between">
          <Link href="/" aria-label="Accueil" className="inline-block">
            <Logo light />
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-paper/55 md:text-right">
            {site.tagline}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-t border-brass/25 py-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className={label}>Bureau d&apos;études</div>
            <p className="text-paper/70 leading-relaxed">
              {site.legal.company}
              <br />
              {site.address.street}
              <br />
              {site.address.zip} {site.address.city}
            </p>
          </div>

          <div>
            <div className={label}>Contact</div>
            <Link href="/contact" className="hover:text-brass-2">
              Nous écrire
            </Link>
            {site.phone && (
              <>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="block mt-1 hover:text-brass-2">
                  {site.phone}
                </a>
                <span className="block text-xs text-paper/55">Laissez-nous un message, on vous rappelle.</span>
              </>
            )}
            <p className="mt-4 text-paper/70 leading-relaxed">
              Réponse sous 48 h ouvrées.
              <br />
              Intervention partout en France.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {site.social.instagram && (
                <a href={site.social.instagram} rel="me noopener" className="inline-flex items-center gap-2 hover:text-brass-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                  Instagram
                </a>
              )}
              {site.authorSocial.linkedin && (
                <a href={site.authorSocial.linkedin} rel="me noopener" className="inline-flex items-center gap-2 hover:text-brass-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <rect x="2.5" y="2.5" width="19" height="19" rx="3" />
                    <path d="M7.2 10.4v7M7.2 7.1v.1M11.4 17.4v-7M11.4 13.2c0-1.5 1-2.6 2.5-2.6s2.5 1.1 2.5 2.6v4.2" strokeLinecap="round" />
                  </svg>
                  LinkedIn
                </a>
              )}
              {site.social.google && (
                <a href={site.social.google} rel="noopener" className="inline-flex items-center gap-2 hover:text-brass-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M12 21.5s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" strokeLinejoin="round" />
                    <circle cx="12" cy="10.2" r="2.6" />
                  </svg>
                  Google
                </a>
              )}
            </div>
          </div>

          <div>
            <div className={label}>Plan du site</div>
            <ul className="grid gap-2.5">
              <li><Link href="/tarifs" className="hover:text-brass-2">Formules et tarifs</Link></li>
              <li><Link href="/plans-execution" className="hover:text-brass-2">Plans d&apos;exécution</Link></li>
              <li><Link href="/permis-de-construire-maison" className="hover:text-brass-2">Le guide du permis</Link></li>
              <li><Link href="/conseils" className="hover:text-brass-2">Conseils</Link></li>
              <li><Link href="/a-propos" className="hover:text-brass-2">À propos</Link></li>
              <li><Link href="/devis" className="hover:text-brass-2">Demander un devis</Link></li>
              <li><Link href="/dossier" className="hover:text-brass-2">Fiche projet complète</Link></li>
              <li><Link href="/plan-de-masse" className="hover:text-brass-2">Envoyer un plan de masse</Link></li>
              <li><Link href="/contact" className="hover:text-brass-2">Contact</Link></li>
              <li><a href={site.parentUrl} className="hover:text-brass-2" rel="noopener">Site {site.parent}</a></li>
            </ul>
          </div>

          <div>
            <div className={label}>Indice</div>
            <table className="w-full text-paper/70">
              <tbody>
                <tr className="border-b border-brass/15">
                  <td className="py-2 pr-3">Échelle</td>
                  <td className="py-2 text-right text-paper">1 / 100</td>
                </tr>
                <tr className="border-b border-brass/15">
                  <td className="py-2 pr-3">Émission</td>
                  <td className="py-2 text-right text-paper">{year}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">Phase</td>
                  <td className="py-2 text-right text-paper">PC</td>
                </tr>
              </tbody>
            </table>
            <ul className="mt-5 grid gap-1.5 text-xs text-paper/60">
              <li><Link href="/mentions-legales" className="hover:text-brass-2">Mentions légales</Link></li>
              <li><Link href="/cgv" className="hover:text-brass-2">CGV</Link></li>
              <li><Link href="/confidentialite" className="hover:text-brass-2">Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <p className="border-t border-brass/25 pt-6 text-xs text-paper/45">
          © {year} {site.legal.company}. {site.name} est l&apos;offre permis de construire de {site.parent}, bureau d&apos;études au Havre qui allie ingénierie et architecture.
        </p>
      </div>
    </footer>
  );
}
