import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import Garanties from "@/components/Garanties";
import JsonLd from "@/components/JsonLd";
import CartesPlanches from "@/components/planche/CartesPlanches";
import PlancheGratuite from "@/components/planche/PlancheGratuite";
import { departements as departementsNormandie } from "@/config/normandie";
import { FAQ_COMMUNE, HUB } from "@/config/planchesGratuites";
import type { DepartementFr, Region } from "@/config/territoires";
import { villePath, villesDu } from "@/lib/normandie";
import { breadcrumb, faqPageSchema, webApplicationSchema } from "@/lib/schema";
import { withSeo } from "@/lib/seo";
import {
  departementPath,
  departementsDe,
  getTerritoire,
  lieu,
  regionDe,
  regionPath,
  territoireDescription,
  territoirePath,
  territoireSlug,
  territoires,
  territoireTitle,
  type Territoire,
} from "@/lib/territoires";

export const dynamicParams = false;

export function generateStaticParams() {
  return territoires().map((t) => ({ territoire: territoireSlug(t) }));
}

type Params = { params: Promise<{ territoire: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = getTerritoire((await params).territoire);
  if (!t) return {};
  return withSeo(territoirePath(t), { title: territoireTitle(t), description: territoireDescription(t) });
}

const lien = "text-ink underline decoration-brass underline-offset-4";

/** La question « partout en France » de la FAQ commune est remplacée par sa version locale. */
const faqCommune = FAQ_COMMUNE.filter((f) => !f.q.startsWith("Le service fonctionne-t-il partout"));

function faqTerritoire(t: Territoire): { q: string; a: string }[] {
  const l = lieu(t);
  return [
    {
      q: `Le plan gratuit est-il disponible partout ${l} ?`,
      a: `Oui, pour tout terrain cadastré ${l}, en ville comme à la campagne : il suffit de saisir l'adresse puis de confirmer la parcelle sur la photo aérienne. Le plan est établi d'après le cadastre et les données de l'IGN, et arrive par e-mail en PDF A3.`,
    },
    {
      q: `Où déposer un permis de construire ${l} ?`,
      a: "À la mairie de la commune où se trouve le terrain, au guichet ou sur sa plateforme de dépôt en ligne. Ce n'est ni la préfecture ni le département qui reçoit la demande. Les règles à respecter sont celles du document d'urbanisme de la commune (PLU, PLUi ou carte communale), consultable sur le Géoportail de l'urbanisme.",
    },
    ...faqCommune,
  ];
}

function chapo(t: Territoire): string {
  const base =
    "plan de masse, plan de situation ou plan de coupe de votre terrain, en PDF A3, établi par notre bureau d'études d'après le cadastre et les altitudes de l'IGN. C'est la base des pièces PCMI 1 à 3 d'un permis de construire ou DP1 à DP3 d'une déclaration préalable. Gratuit, une planche par terrain.";
  if (t.type === "region") {
    const deps = departementsDe(t.region).map((d) => d.nom);
    const liste = deps.length > 1 ? `${deps.slice(0, -1).join(", ")} ou ${deps.at(-1)}` : deps[0];
    return `Votre terrain est ${t.region.dans}, ${deps.length > 1 ? `dans l'un de ses ${deps.length} départements (${liste})` : `en ${liste}`} ? Saisissez son adresse : vous recevez par e-mail le ${base}`;
  }
  const d = t.departement;
  const ou = d.code === "75" ? "à Paris" : `à ${d.prefecture} ou dans une autre commune ${d.dans}`;
  return `Votre terrain est ${ou} ? Saisissez son adresse : vous recevez par e-mail le ${base}`;
}

function filAriane(t: Territoire): { name: string; path: string }[] {
  const debut = [
    { name: "Accueil", path: "/" },
    { name: HUB.court, path: HUB.path },
  ];
  if (t.type === "region") return [...debut, { name: t.region.nom, path: regionPath(t.region) }];
  const r = regionDe(t.departement);
  return [...debut, { name: r.nom, path: regionPath(r) }, { name: t.departement.nom, path: departementPath(t.departement) }];
}

export default async function TerritoirePage({ params }: Params) {
  const t = getTerritoire((await params).territoire);
  if (!t) notFound();
  const path = territoirePath(t);
  const h1 = `Plans gratuits de votre terrain ${t.type === "region" ? t.region.dans : t.departement.dans}`;
  const faq = faqTerritoire(t);
  const ariane = filAriane(t);

  return (
    <>
      <JsonLd
        data={[
          webApplicationSchema(path, h1, territoireDescription(t), "DesignApplication"),
          faqPageSchema(faq),
          breadcrumb(ariane),
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.2em] text-bronze">
          {ariane.slice(1).map((a, i, tout) => (
            <span key={a.path}>
              {i < tout.length - 1 ? (
                <>
                  <Link href={a.path} className="hover:text-ink">{a.name}</Link> ·{" "}
                </>
              ) : (
                <>{t.type === "departement" ? `${a.name} (${t.departement.code})` : a.name}</>
              )}
            </span>
          ))}
        </p>
        <h1 className="display mt-4 max-w-[20ch] text-5xl sm:text-6xl">{h1}</h1>
        <p className="lead mt-7 max-w-[62ch]">{chapo(t)}</p>

        <CartesPlanches className="mt-14" />

        <section id="formulaire" className="mt-14 scroll-mt-24 bg-stone px-5 py-8 sm:px-10 sm:py-12" aria-label="Demander un plan gratuit">
          <PlancheGratuite planchePage="masse" />
        </section>
      </div>

      {t.type === "region" ? <DepartementsDeLaRegion region={t.region} /> : <VotreDossier departement={t.departement} />}

      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Questions fréquentes</h2>
        <div className="mt-10">
          <Faq items={faq} />
        </div>
      </section>

      <section className="border-t border-stone-2 bg-stone">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <span className="rule" aria-hidden="true" />
          <h2 className="h-section mt-6">Et pour le permis complet ?</h2>
          <p className="mt-6 max-w-[62ch] leading-relaxed text-ink-2">
            Nous montons votre dossier de permis de construire {lieu(t)}, pièces PCMI 1 à 8, le déposons en mairie et le
            suivons jusqu&apos;à l&apos;arrêté. Prix fixe annoncé avant de commencer, payable en 1, 4 ou 10 fois.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/commander" className="btn btn-ink">Commander mon permis</Link>
            <Link href="/tarifs" className="btn btn-line">Voir les tarifs</Link>
          </div>
          <Garanties className="mt-16" />
        </div>
      </section>
    </>
  );
}

function DepartementsDeLaRegion({ region }: { region: Region }) {
  const deps = departementsDe(region);
  return (
    <section className="border-y border-stone-2 bg-stone">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <span className="rule" aria-hidden="true" />
        <h2 className="h-section mt-6">Les départements {region.de}</h2>
        <ul data-stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {deps.map((d) => (
            <li key={d.code} className="border-t border-stone-2 pt-4">
              <Link href={departementPath(d)} className="display text-2xl hover:text-bronze">
                {d.nom} ({d.code})
              </Link>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">
                Plans gratuits de votre terrain {d.dans}, de {d.prefecture} aux plus petites communes.
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-ink-2">
          Autre région ? <Link href={`${HUB.path}#regions`} className={lien}>Toutes les régions et tous les départements</Link>
        </p>
      </div>
    </section>
  );
}

function VotreDossier({ departement: d }: { departement: DepartementFr }) {
  const r = regionDe(d);
  const voisins = departementsDe(r).filter((x) => x.code !== d.code);
  const normand = departementsNormandie.some((x) => x.code === d.code);
  const villes = normand ? villesDu(d.code as (typeof departementsNormandie)[number]["code"]) : [];

  return (
    <section className="border-y border-stone-2 bg-stone">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <article className="prose-guide">
          <h2>Votre permis de construire {d.dans}</h2>
          <p>
            Le dossier se dépose à la mairie de la commune du terrain, pas à la préfecture de {d.prefecture}. La mairie
            vérifie le projet au regard de son document d&apos;urbanisme : plan local d&apos;urbanisme (PLU), PLU
            intercommunal ou carte communale. Sans document local, c&apos;est le règlement national d&apos;urbanisme qui
            s&apos;applique. Le règlement de votre zone se consulte sur le{" "}
            <a href="https://www.geoportail-urbanisme.gouv.fr/" rel="noopener" className={lien}>Géoportail de l&apos;urbanisme</a>.
          </p>
          <p>
            Les trois premières pièces du dossier décrivent le terrain : le plan de situation (PCMI 1 ou DP1), le plan de
            masse (PCMI 2 ou DP2) et le plan en coupe (PCMI 3 ou DP3). Notre planche gratuite en donne l&apos;état
            existant : de quoi vérifier la place disponible et les reculs avant de dessiner la maison, l&apos;extension ou
            l&apos;abri de jardin.
          </p>
          {normand ? (
            <p>
              Notre bureau d&apos;études est installé au Havre : {d.dans}, nous connaissons les règles locales et les
              contraintes des terrains normands, et pouvons nous déplacer sur site.
            </p>
          ) : (
            <p>
              Notre bureau d&apos;études est installé au Havre et monte les dossiers {d.dans} à distance, au même prix
              qu&apos;ailleurs : vos documents, des échanges par visio ou téléphone, et un dépôt sur la plateforme en ligne
              de votre commune.
            </p>
          )}
        </article>

        <div className="grid content-start gap-12">
          {villes.length > 0 && (
            <div>
              <h2 className="display text-2xl">Permis de construire {d.dans}, ville par ville</h2>
              <ul className="mt-4 grid gap-1.5 text-[0.98rem]">
                {villes.map((v) => (
                  <li key={v.slug}>
                    <Link href={villePath(v)} className={lien}>Permis de construire {v.a}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="display text-2xl">
              Ailleurs {r.dans}
            </h2>
            <ul className="mt-4 grid gap-1.5 text-[0.98rem]">
              {voisins.map((x) => (
                <li key={x.code}>
                  <Link href={departementPath(x)} className={lien}>Plans gratuits {x.dans}</Link>
                </li>
              ))}
              <li>
                <Link href={regionPath(r)} className={lien}>Toute la région {r.nom}</Link>
              </li>
              <li>
                <Link href={`${HUB.path}#regions`} className={lien}>Tous les départements</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
