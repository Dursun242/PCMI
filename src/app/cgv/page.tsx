// À VALIDER PAR UN JURISTE avant mise en ligne définitive.
// Ce texte est une base rédigée à partir des données produit connues du site
// (formules, prix, acompte) et de la structure légale standard d'un contrat
// de prestation de services à distance BtoC. Il ne remplace pas une relecture
// par un avocat ou un juriste spécialisé en droit de la consommation.
import type { Metadata } from "next";
import Link from "next/link";
import { plans, options, site } from "@/config/site";
import { legal } from "@/lib/legal";
import { formatEuro } from "@/components/PlanCard";
import { withSeo } from "@/lib/seo";

export const metadata: Metadata = withSeo("/cgv", {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente des prestations de dossier de permis de construire Permis by ID Maîtrise : formules, prix, acompte, délais, rétractation.",
  robots: { index: true, follow: true },
});

export default function CgvPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-16 prose-guide">
      <h1 className="display text-5xl">Conditions générales de vente</h1>
      <p className="text-sm text-ink-2">En vigueur au {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.</p>

      <h2>1. Objet et champ d&apos;application</h2>
      <p>
        Les présentes conditions générales de vente (CGV) régissent les prestations de conception et de montage de dossiers de permis de construire ou de déclaration préalable pour des maisons individuelles, vendues à distance par {legal.raisonSociale} ({legal.forme} au capital de {legal.capital}, SIREN {legal.siren}), sous la marque « {site.name} », à des personnes physiques agissant en tant que consommateurs (« le client »). Toute commande implique l&apos;acceptation sans réserve des présentes CGV, qui prévalent sur tout autre document.
      </p>

      <h2>2. Formules et prix</h2>
      <p>Trois formules à prix fixe sont proposées, pour des maisons dont la surface de plancher totale n&apos;excède pas 149 m² :</p>
      <ul>
        {plans.map((p) => (
          <li key={p.id}>
            <strong>{p.name}</strong> — {formatEuro(p.priceTTC)} TTC, livrée sous {p.delayWorkingDays} : {p.promise}
          </li>
        ))}
      </ul>
      <p>
        Au-delà de 149 m² de surface de plancher, et dans tous les cas où le recours à un architecte est légalement obligatoire (surface de plancher supérieure à 150 m², cf. article R.431-2 du Code de l&apos;urbanisme), la prestation est établie sur devis personnalisé avec notre architecte partenaire et ne relève pas des formules ci-dessus.
      </p>
      <p>Options facturées en supplément, sur demande :</p>
      <ul>
        {options.map((o) => (
          <li key={o.name}>{o.name} — {formatEuro(o.priceTTC)} TTC ({o.note})</li>
        ))}
      </ul>
      <p>Les prix sont exprimés toutes taxes comprises, TVA 20 % incluse, et n&apos;évoluent pas après acceptation du devis, hors ajout d&apos;options par le client.</p>

      <h2>3. Devis et formation du contrat</h2>
      <p>
        Toute prestation fait l&apos;objet d&apos;un devis écrit préalable, établi après lecture du règlement d&apos;urbanisme applicable au terrain du client. Le contrat est formé à la date d&apos;acceptation expresse du devis par le client (signature, réponse écrite d&apos;accord ou paiement de l&apos;acompte, selon le mode d&apos;acceptation proposé) et du versement de l&apos;acompte prévu à l&apos;article 4.
      </p>

      <h2>4. Prix, acompte et paiement</h2>
      <p>
        Le prix est payable de la façon suivante : un acompte de <strong>40 %</strong> du montant TTC est dû à la commande, le solde à la livraison du dossier prêt à déposer (formule Essentiel) ou selon l&apos;échéancier précisé au devis pour les formules Complet et Premium. Le paiement s&apos;effectue par virement ou carte bancaire. Une facture est émise par {legal.raisonSociale} à chaque règlement.
      </p>

      <h2>5. Délais</h2>
      <p>
        Les délais de livraison indiqués par formule (10, 15 ou 20 jours ouvrés selon la formule choisie) courent à compter de la réception, par {legal.raisonSociale}, de l&apos;ensemble des documents et informations nécessaires visés à l&apos;article 6, et du versement de l&apos;acompte. Ces délais sont donnés à titre indicatif et peuvent être ajustés en fonction de la complexité du dossier ou du temps de réponse du client aux demandes de précisions ; le client en est informé sans délai.
      </p>

      <h2>6. Obligations du client</h2>
      <p>
        Le client s&apos;engage à fournir des informations exactes et complètes sur son projet et son terrain, ainsi que les documents demandés (références cadastrales, plan de bornage le cas échéant, certificat d&apos;urbanisme, plans ou croquis existants, photographies du terrain, et tout document utile au contrôle de conformité au règlement d&apos;urbanisme). Tout retard ou inexactitude dans la fourniture de ces éléments peut entraîner un allongement des délais visés à l&apos;article 5, sans que {legal.raisonSociale} en soit responsable.
      </p>

      <h2>7. Modifications et garantie en cas de refus</h2>
      <p>
        Le nombre de séries de modifications avant dépôt (une série pour la formule Essentiel, illimitées pour les formules Complet et Premium) et, pour les formules Complet et Premium, la reprise et le redépôt du dossier en cas de refus, s&apos;entendent <strong>pour un même terrain et un même programme de construction</strong> tel que décrit au devis initial. Toute modification substantielle du projet (changement de terrain, de nature ou d&apos;ampleur du programme) fait l&apos;objet d&apos;un nouveau devis. La garantie de reprise en cas de refus ne s&apos;applique qu&apos;aux motifs de refus portant sur des points de conformité relevant de la maîtrise de {legal.raisonSociale} (implantation, hauteur, emprise au sol, aspect extérieur conformes au règlement en vigueur au dépôt) ; elle ne couvre pas un refus fondé sur un changement de réglementation postérieur au dépôt ou sur un avis défavorable d&apos;une autorité extérieure (Architecte des Bâtiments de France, service assainissement, gestionnaire de voirie, etc.), qui fait l&apos;objet d&apos;une analyse offerte au cas par cas.
      </p>

      <h2>8. Droit de rétractation</h2>
      <p>
        Conformément aux articles L. 221-18 et suivants du Code de la consommation, le client consommateur dispose d&apos;un délai de <strong>14 jours calendaires</strong> à compter de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à justifier de motif ni à supporter d&apos;autres coûts que ceux prévus au présent article.
      </p>
      <p>
        Pour exercer ce droit, le client notifie sa décision par une déclaration dénuée d&apos;ambiguïté (courrier ou message via le <Link href="/contact">formulaire de contact</Link>), le cas échéant au moyen du formulaire type ci-dessous.
      </p>
      <p>
        <strong>Exécution avant la fin du délai de rétractation.</strong> Le client peut demander expressément, dès la commande, que la prestation commence avant l&apos;expiration du délai de rétractation de 14 jours (case dédiée lors de la demande de devis). Dans ce cas, conformément à l&apos;article L. 221-25 du Code de la consommation :
      </p>
      <ul>
        <li>si le client se rétracte alors que la prestation n&apos;est pas encore intégralement exécutée, il paie un montant correspondant au service fourni jusqu&apos;à la communication de sa décision de se rétracter, proportionnel au prix total de la prestation ;</li>
        <li>si la prestation est intégralement exécutée avant la fin du délai de 14 jours, à la demande expresse du client, le droit de rétractation ne peut plus être exercé, conformément à l&apos;article L. 221-28, 13° du Code de la consommation.</li>
      </ul>
      <p>À défaut de cette demande expresse, aucune prestation n&apos;est exécutée avant la fin du délai de rétractation de 14 jours.</p>

      <h3>Formulaire type de rétractation</h3>
      <p className="text-sm text-ink-2">
        (Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat, via le <Link href="/contact">formulaire de contact</Link>.)
      </p>
      <p className="text-sm text-ink-2">
        À l&apos;attention de {legal.raisonSociale}, {legal.adresse.street}, {legal.adresse.zip} {legal.adresse.city} — {legal.email}.
        <br />
        Je/nous (*) notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la prestation ci-dessous :
        <br />
        Commandée le (*) / reçue le (*) : ……
        <br />
        Nom et adresse du client : ……
        <br />
        Signature du client (uniquement en cas de notification du présent formulaire sur papier) : ……
        <br />
        Date : ……
        <br />
        (*) Rayer la mention inutile.
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        Les plans, notices et documents graphiques produits par {legal.raisonSociale} dans le cadre de la prestation sont cédés au client, à l&apos;achèvement du paiement intégral, pour le seul usage de la construction du projet objet du devis. Toute réutilisation pour un autre programme ou une autre parcelle nécessite l&apos;accord écrit de {legal.raisonSociale}.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        {legal.raisonSociale} est tenue à une obligation de moyens dans la conception du dossier et son contrôle de conformité au règlement d&apos;urbanisme en vigueur à la date du dépôt. {legal.raisonSociale} n&apos;est pas responsable des décisions de l&apos;autorité administrative compétente pour délivrer le permis, ni des conséquences d&apos;informations inexactes ou incomplètes transmises par le client. {legal.raisonSociale} est assurée en responsabilité civile professionnelle auprès de {legal.assurance.assureur} (police n° {legal.assurance.policeNumero}).
      </p>

      <h2>11. Médiation de la consommation</h2>
      <p>
        En cas de litige, le client peut, avant toute action judiciaire, recourir gratuitement au médiateur de la consommation : {legal.mediateur.nom}, {legal.mediateur.adresse} — {legal.mediateur.site}. Le client peut également recourir à la plateforme européenne de règlement en ligne des litiges.
      </p>

      <h2>12. Droit applicable et juridiction</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, et après tentative de résolution amiable (le cas échéant via la médiation prévue à l&apos;article 11), les tribunaux français compétents seront saisis selon les règles de droit commun.
      </p>

      <p className="mt-10 text-sm text-ink-2">
        Voir aussi les <Link href="/mentions-legales">mentions légales</Link> et la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </div>
  );
}
