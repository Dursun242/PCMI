import { site, plans, exePlans, exePacks, metiers, thermique } from "@/config/site";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${site.url}/#organization`,
  name: site.name,
  legalName: site.legal.company,
  url: site.url,
  email: site.email,
  logo: `${site.url}/brand/logo-black.png`,
  image: `${site.url}/brand/logo-black.png`,
  ...(site.phone ? { telephone: site.phone } : {}),
  parentOrganization: { "@type": "Organization", name: site.parent, url: site.parentUrl },
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.zip,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  areaServed: { "@type": "Country", name: "France" },
  // Comptes de l'entreprise uniquement. Les entrées vides sont écartées.
  sameAs: Object.values(site.social).filter(Boolean),
  foundingLocation: { "@type": "Place", name: `${site.address.city}, ${site.address.region}` },
  founder: { "@type": "Person", name: site.author, jobTitle: "Maître d'œuvre" },
  knowsAbout: [
    "Permis de construire maison individuelle",
    "Architecture de maison individuelle",
    "Dessinateur en bâtiment",
    "Ingénierie béton armé",
    "Calcul de structure et charpente",
    "Plans d'exécution",
    "RE2020",
    "Étude thermique RE2020, Bbio, Cep, ACV",
    ...metiers.map((m) => m.titre),
  ],
  description:
    "Conception et dépôt de dossiers de permis de construire pour maisons individuelles, par un bureau d'études qui allie ingénierie de la construction et conception architecturale, partout en France.",
  makesOffer: plans.map((p) => ({
    "@type": "Offer",
    name: `Permis de construire maison — formule ${p.name}`,
    price: p.priceTTC,
    priceCurrency: "EUR",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: p.priceTTC,
      priceCurrency: "EUR",
      valueAddedTaxIncluded: true,
    },
    itemOffered: {
      "@type": "Service",
      name: `Dossier de permis de construire maison individuelle — ${p.name}`,
      description: p.promise,
      serviceType: "Permis de construire",
    },
    url: `${site.url}/tarifs#${p.id}`,
  })),
};

/** FAQPage générique : réutilisée pour la FAQ de l'accueil et celle du guide. */
export function faqPageSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}


/** Référence courte vers l'Organization, pour ne pas la redéclarer partout. */
export const ORG_REF = { "@id": `${site.url}/#organization` };

/** Le site lui-même. Présent sur toutes les pages, via le layout. */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.name,
  inLanguage: "fr-FR",
  publisher: ORG_REF,
};

/** L'auteur des contenus. Le même objet pour le guide et les articles. */
export const authorSchema = {
  "@type": "Person",
  // Même signature que celle affichée sous les titres : un schéma qui
  // annoncerait le nom complet le rendrait public malgré l'abréviation.
  name: site.author,
  jobTitle: "Maître d'œuvre",
  worksFor: ORG_REF,
  url: `${site.url}/a-propos`,
  // Profils personnels : ils rattachent l'auteur à une identité vérifiable.
  sameAs: Object.values(site.authorSocial).filter(Boolean),
};

/** Service vendu sur /tarifs : les trois formules en Offer. */
export function serviceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Dossier de permis de construire de maison individuelle",
    serviceType: "Dossier de permis de construire de maison individuelle",
    provider: ORG_REF,
    areaServed: { "@type": "Country", name: "France" },
    url: `${site.url}/tarifs`,
    description:
      "Conception du dossier de permis de construire d'une maison individuelle jusqu'à 149 m² de surface de plancher (pièces PCMI 1 à 8), dépôt en mairie et suivi jusqu'à l'accord selon la formule.",
    offers: plans.map((p) => ({
      "@type": "Offer",
      name: `Formule ${p.name}`,
      description: p.promise,
      price: p.priceTTC,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: "France" },
      url: `${site.url}/tarifs#${p.id}`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: p.priceTTC,
        priceCurrency: "EUR",
        valueAddedTaxIncluded: true,
      },
    })),
  };
}

/** Service vendu sur /plans-execution : lots et packs en Offer, prix « à partir de ». */
export function exeServiceSchema() {
  const offer = (o: { id: string; name: string; fromPriceTTC: number; description: string }) => ({
    "@type": "Offer",
    name: o.name,
    description: o.description,
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    eligibleRegion: { "@type": "Country", name: "France" },
    url: `${site.url}/plans-execution#${o.id}`,
    priceSpecification: {
      "@type": "PriceSpecification",
      minPrice: o.fromPriceTTC,
      priceCurrency: "EUR",
      valueAddedTaxIncluded: true,
    },
  });
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Plans d'exécution de maison individuelle",
    serviceType: "Plans d'exécution (structure, charpente, réseaux)",
    provider: ORG_REF,
    areaServed: { "@type": "Country", name: "France" },
    url: `${site.url}/plans-execution`,
    description:
      "Plans d'exécution dessinés et calculés par un bureau d'études qui allie ingénierie et architecture, après l'accord du permis : fondations, béton armé, plancher, charpente, couverture, menuiseries, électricité, plomberie, VRD et détails techniques. Dimensionnement des ouvrages porteurs par le bureau d'études structure.",
    offers: [
      ...exePacks.map((p) => offer({ id: p.id, name: p.name, fromPriceTTC: p.fromPriceTTC, description: p.promise })),
      ...exePlans.map((p) => offer(p)),
    ],
  };
}

/** Service vendu sur /etude-thermique-re2020 : prestations en Offer, prix « à partir de ». */
export function thermiqueServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Étude thermique RE2020 de maison individuelle",
    serviceType: "Étude thermique et environnementale RE2020 (attestation, Bbio, Cep, ACV)",
    provider: ORG_REF,
    areaServed: { "@type": "Country", name: "France" },
    url: `${site.url}/etude-thermique-re2020`,
    description:
      "Attestation RE2020 au dépôt du permis et à l'achèvement, étude thermique complète (Bbio, Cep, Cep,nr, DH, Ic énergie, Ic construction) et analyse de cycle de vie, par le thermicien du bureau d'études.",
    offers: thermique.map((t) => ({
      "@type": "Offer",
      name: t.name,
      description: t.description,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      eligibleRegion: { "@type": "Country", name: "France" },
      url: `${site.url}/etude-thermique-re2020#${t.id}`,
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: t.fromPriceTTC,
        priceCurrency: "EUR",
        valueAddedTaxIncluded: true,
      },
    })),
  };
}

/** Article de blog : /conseils/[slug]. */
export function blogPostingSchema(a: {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  keywords: string[];
  image?: string;
  wordCount: number;
}) {
  const url = `${site.url}/conseils/${a.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.updated ?? a.date,
    inLanguage: "fr-FR",
    author: authorSchema,
    publisher: ORG_REF,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    wordCount: a.wordCount,
    ...(a.image ? { image: `${site.url}${a.image}` } : {}),
    ...(a.keywords.length ? { keywords: a.keywords.join(", ") } : {}),
  };
}

/** Article long hors blog : le guide. */
export function articleSchema(a: {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  wordCount?: number;
}) {
  const url = `${site.url}${a.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    inLanguage: "fr-FR",
    author: authorSchema,
    publisher: ORG_REF,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
  };
}

/** Index des articles. */
export function collectionPageSchema(items: { slug: string; title: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${site.url}/conseils`,
    name: "Conseils permis de construire",
    inLanguage: "fr-FR",
    isPartOf: { "@id": `${site.url}/#website` },
    publisher: ORG_REF,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.title,
        url: `${site.url}/conseils/${a.slug}`,
      })),
    },
  };
}

/** Pages de mise en relation : /contact, /devis, /dossier. */
export function contactPageSchema(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${site.url}${path}`,
    name,
    inLanguage: "fr-FR",
    isPartOf: { "@id": `${site.url}/#website` },
    about: ORG_REF,
    mainEntity: ORG_REF,
  };
}

/** /a-propos. */
export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${site.url}/a-propos`,
    name: `À propos de ${site.name}`,
    inLanguage: "fr-FR",
    isPartOf: { "@id": `${site.url}/#website` },
    about: ORG_REF,
    mainEntity: ORG_REF,
  };
}
