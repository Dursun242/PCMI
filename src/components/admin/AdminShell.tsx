"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <nav className="flex flex-wrap items-center gap-5">
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
          <button type="button" onClick={logout} className="btn btn-line text-sm">
            Déconnexion
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
