import type { Metadata } from "next";
import PagePlancheGratuite from "@/components/planche/PagePlancheGratuite";
import { PAGES_PLANCHES } from "@/config/planchesGratuites";
import { withSeo } from "@/lib/seo";

const PAGE = PAGES_PLANCHES.situation;

export const metadata: Metadata = withSeo(PAGE.path, { title: PAGE.metaTitre, description: PAGE.description });

export default function Page() {
  return <PagePlancheGratuite page={PAGE} />;
}
