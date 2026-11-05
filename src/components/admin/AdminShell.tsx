"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { UMAMI } from "./liens";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/express", label: "Express" },
  { href: "/admin/planches", label: "Plans gratuits" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/chiffres", label: "Chiffres clés" },
  { href: "/admin/realisations", label: "Réalisations" },
];

const lien = "text-ink-2 transition-colors hover:text-ink";

/**
 * Cadre de l'espace admin : sa propre barre (le bandeau, l'en-tête et le pied
 * de page du site public sont masqués ici, voir HorsAdmin), puis le contenu.
 * Le menu passe à la ligne sur téléphone plutôt que d'être coupé.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Les visites de l'administrateur ne comptent pas dans Umami, sur cet appareil
  // (réglage prévu par Umami, lu par son script avant chaque envoi).
  useEffect(() => {
    try {
      localStorage.setItem("umami.disabled", "1");
    } catch {
      /* stockage indisponible : la visite sera comptée */
    }
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone">
      <header className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4 text-sm">
            <Link href="/admin" className="flex items-baseline gap-2">
              <span className="display text-xl">id Maîtrise</span>
              <span className="text-ink-3">Admin</span>
            </Link>
            <span className="flex items-center gap-5">
              <a href="/" target="_blank" rel="noopener noreferrer" className={lien}>
                Voir le site ↗
              </a>
              <button type="button" onClick={logout} className={`${lien} cursor-pointer`}>
                Déconnexion
              </button>
            </span>
          </div>
          <nav aria-label="Espace admin" className="-mb-px flex flex-wrap gap-x-4 text-sm sm:gap-x-5">
            {NAV.map((item) => {
              const actif = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={actif ? "page" : undefined}
                  className={`border-b-2 py-2.5 transition-colors ${
                    actif ? "border-forest text-ink" : "border-transparent text-ink-2 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <a href={UMAMI} target="_blank" rel="noopener noreferrer" className="border-b-2 border-transparent py-2.5 text-ink-2 transition-colors hover:text-ink">
              Statistiques ↗
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
