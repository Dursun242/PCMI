import type { Metadata } from "next";
import SuiviDp from "@/components/dp/SuiviDp";

export const metadata: Metadata = {
  title: "Votre déclaration de piscine",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <SuiviDp />
    </div>
  );
}
