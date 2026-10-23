import { ACTIONS, APPAREILS, CHAMPS, SECTIONS, ZONES, type Analyse } from "@/lib/bilan";
import { FAQ_EXPRESS } from "@/lib/express";

/**
 * Détail des visites de /permis-express (bilans de visite, lib/bilan.ts) :
 * jusqu'où on lit, questions ouvertes, boutons touchés, appareils,
 * formulaires abandonnés. Affichage seul, sans calcul autre que des parts.
 */

const titre = "mt-10 sm:mt-12 text-sm font-bold uppercase tracking-[0.18em] text-ink-2";
const part = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/** Une ligne libellé · barre · nombre, la barre en part de `total`. */
function Ligne({ libelle, n, total }: { libelle: string; n: number; total: number }) {
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_4.5rem] items-center gap-3 border-b border-stone-2 px-3 py-2.5 sm:grid-cols-[minmax(0,16rem)_1fr_6rem] sm:px-4">
      <span className={`leading-snug ${n ? "font-bold" : "text-ink-3"}`}>{libelle}</span>
      <span className="h-2 bg-stone-2" aria-hidden="true">
        <span className="block h-full bg-forest" style={{ width: `${part(n, total)}%` }} />
      </span>
      <span className="text-right tabular-nums">
        {n} <span className="text-ink-2">· {part(n, total)} %</span>
      </span>
    </li>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-ink-2">{children}</p>;
}

export default function AnalyseExpress({ a }: { a: Analyse }) {
  if (a.visites === 0) {
    return (
      <>
        <h2 className={titre}>Détail des visites (30 jours)</h2>
        <p className="mt-3 bg-paper p-4 text-sm text-ink-2">
          Aucune visite détaillée pour l&apos;instant : le détail est mesuré depuis sa mise en place.
        </p>
      </>
    );
  }

  const abandons = CHAMPS.reduce((n, [c]) => n + a.abandons[c], 0);
  const zonesTouchees = ZONES.filter(([z]) => ACTIONS.some(([act]) => a.clics[`${z}-${act}`]));

  return (
    <>
      <h2 className={titre}>Jusqu&apos;où ils lisent (30 jours)</h2>
      <ul className="mt-3 bg-paper text-sm">
        {SECTIONS.map(([s, libelle]) => (
          <Ligne key={s} libelle={libelle} n={a.sections[s]} total={a.visites} />
        ))}
      </ul>
      <Note>Part des {a.visites} visites détaillées qui ont fait défiler la page jusqu&apos;à chaque partie.</Note>

      <h2 className={titre}>Questions ouvertes</h2>
      <ul className="mt-3 bg-paper text-sm">
        {[...FAQ_EXPRESS]
          .sort((x, y) => a.faq[y.cle] - a.faq[x.cle])
          .map((q) => (
            <Ligne key={q.cle} libelle={q.question} n={a.faq[q.cle]} total={a.visites} />
          ))}
      </ul>
      <Note>Les questions les plus ouvertes disent ce qui inquiète : à traiter plus haut dans la page ou dans les annonces.</Note>

      <h2 className={titre}>Boutons touchés</h2>
      {zonesTouchees.length === 0 ? (
        <p className="mt-3 bg-paper p-4 text-sm text-ink-2">Aucun bouton touché pour l&apos;instant.</p>
      ) : (
        <table className="mt-3 w-full border-collapse bg-paper text-sm">
          <thead>
            <tr className="border-b border-ink text-left">
              <th className="p-2 font-bold sm:p-3">Emplacement</th>
              {ACTIONS.map(([act, libelle]) => (
                <th key={act} className="p-2 text-right font-bold sm:p-3">{libelle}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zonesTouchees.map(([z, libelle]) => (
              <tr key={z} className="border-b border-stone-2">
                <td className="p-2 sm:p-3">{libelle}</td>
                {ACTIONS.map(([act]) => (
                  <td key={act} className={`p-2 text-right tabular-nums sm:p-3 ${a.clics[`${z}-${act}`] ? "font-bold" : "text-ink-3"}`}>
                    {a.clics[`${z}-${act}`]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Note>Nombre de visites qui ont touché chaque bouton. « Mon devis » mène au formulaire, sans encore l&apos;envoyer.</Note>

      <h2 className={titre}>Appareils</h2>
      <table className="mt-3 w-full border-collapse bg-paper text-sm">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="p-2 font-bold sm:p-3">Appareil</th>
            <th className="p-2 text-right font-bold sm:p-3">Visites</th>
            <th className="p-2 text-right font-bold sm:p-3">Appels</th>
            <th className="p-2 text-right font-bold sm:p-3">Demandes</th>
          </tr>
        </thead>
        <tbody>
          {APPAREILS.map(([app, libelle]) => {
            const v = a.appareils[app];
            return (
              <tr key={app} className={`border-b border-stone-2 ${v.visites ? "" : "text-ink-3"}`}>
                <td className="p-2 sm:p-3">{libelle}</td>
                <td className="p-2 text-right tabular-nums whitespace-nowrap sm:p-3">
                  {v.visites} <span className="text-ink-2">· {part(v.visites, a.visites)} %</span>
                </td>
                <td className="p-2 text-right tabular-nums sm:p-3">{v.appels}</td>
                <td className="p-2 text-right tabular-nums sm:p-3">{v.envois}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Note>Appels : visites qui ont touché un bouton Appeler. Demandes : formulaires envoyés depuis cet appareil.</Note>

      <h2 className={titre}>Formulaires abandonnés</h2>
      {abandons === 0 ? (
        <p className="mt-3 bg-paper p-4 text-sm text-ink-2">Aucun formulaire commencé puis abandonné.</p>
      ) : (
        <ul className="mt-3 bg-paper text-sm">
          {CHAMPS.filter(([c]) => a.abandons[c]).map(([c, libelle]) => (
            <Ligne key={c} libelle={libelle} n={a.abandons[c]} total={abandons} />
          ))}
        </ul>
      )}
      <Note>
        Dernier champ touché par les visiteurs partis sans envoyer le formulaire. Un champ qui revient souvent est un
        champ qui bloque.
      </Note>
    </>
  );
}
