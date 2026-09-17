import { site, plans, faq } from "@/config/site";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${site.url}/#organization`,
  name: site.name,
  legalName: site.legal.company,
  url: site.url,
  email: site.email,
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
  founder: { "@type": "Person", name: site.legal.director },
  description:
    "Conception et dépôt de dossiers de permis de construire pour maisons individuelles, par un maître d'œuvre, partout en France.",
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

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

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
