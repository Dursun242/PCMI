// Rejoué à chaque changement de page : le contenu entre en fondu (« .entree-page » dans motion.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entree-page">{children}</div>;
}
