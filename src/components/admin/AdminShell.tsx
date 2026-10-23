"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/express", label: "Compteur Express" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/chiffres", label: "Chiffres clés" },
  { href: "/admin/realisations", label: "Réalisations" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone">
      <header className="border-b border-ink/10 bg-paper">
        {/* Sur téléphone, le menu tient sur une ligne qui défile au doigt. */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <nav className="-mx-1 flex min-w-0 items-center gap-5 overflow-x-auto px-1 py-1 whitespace-nowrap">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-bold tracking-wide ${
                  pathname === item.href ? "text-forest" : "text-ink-2 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button type="button" onClick={logout} className="btn btn-line shrink-0 text-sm !min-h-10 !px-4">
            Déconnexion
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
