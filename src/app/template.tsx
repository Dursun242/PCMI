// Rejoué à chaque changement de page : le contenu glisse en place (« .entree-page » dans motion.css).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entree-page">{children}</div>;
}
