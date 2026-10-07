import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité | Bootcamp Academy',
  description: 'Politique de confidentialité de Novenetech pour la masterclass Bootcamp Academy.',
};

export default function PolitiquePage() {
  return (
    <main className="masterclass-policy-page">
      <div className="masterclass-shell">
        <Link href="/masterclass" className="masterclass-policy-back">← Retour à la masterclass</Link>
        <header>
          <p className="masterclass-section-label">Novemetech · Données personnelles</p>
          <h1>Politique de confidentialité</h1>
          <p className="masterclass-policy-date">Dernière mise à jour : 6 octobre 2026</p>
        </header>
        <article className="masterclass-policy-copy">
          <h2>1. Qui est responsable de vos données ?</h2>
          <p>Les données collectées sur cette page sont traitées par Novenetech (NOVENE TECH), établissement exploité en nom propre par Kallon Bathez Odjegnide Bankole, situé à Sèmè-Podji (Ouémé), Bénin. IFU : 0202315600488 · RCCM : RB/PNO/26 A 125964. Contact : novenetech@gmail.com</p>
          <h2>2. Quelles données collectons-nous ?</h2>
          <ul><li>Nom complet</li><li>Adresse e-mail</li><li>Numéro WhatsApp (avec indicatif du pays)</li><li>Données techniques de navigation (type d&apos;appareil, pages consultées, source de visite), si vous acceptez les cookies de mesure.</li></ul>
          <h2>3. Pourquoi les utilisons-nous ?</h2>
          <ul><li>Gérer votre réservation à la masterclass « De 0 à ton premier client digital ».</li><li>Vous envoyer par e-mail et par WhatsApp le lien d&apos;accès, les rappels et les informations pratiques liées à cet événement.</li><li>Si vous y avez consenti, vous informer de nos futures formations et offres.</li><li>Mesurer l&apos;audience de la page et l&apos;efficacité de nos publicités (Meta Pixel), uniquement si vous l&apos;avez accepté.</li></ul>
          <h2>4. Sur quelle base ?</h2>
          <p>Votre consentement, que vous donnez en cochant la case du formulaire. Vous pouvez le retirer à tout moment.</p>
          <h2>5. Qui reçoit vos données ?</h2>
          <p>Novenetech et ses prestataires techniques strictement nécessaires : hébergement du site, outil d&apos;envoi d&apos;e-mails, WhatsApp (Meta), plateforme de visioconférence. Nous ne vendons pas vos données. Certains prestataires peuvent être situés hors du Bénin ; dans ce cas, nous veillons à ce qu&apos;ils offrent des garanties de protection suffisantes.</p>
          <h2>6. Combien de temps les conservons-nous ?</h2>
          <p>Pendant la durée nécessaire à l&apos;organisation de la masterclass, puis 12 mois maximum après votre dernière interaction, sauf si vous demandez leur suppression avant.</p>
          <h2>7. Vos droits</h2>
          <p>Conformément à la législation béninoise sur la protection des données personnelles, vous pouvez à tout moment : accéder à vos données, les rectifier, les supprimer, vous opposer à leur traitement, retirer votre consentement ou demander leur portabilité. Écrivez à novenetech@gmail.com ; nous répondons dans un délai raisonnable. Vous pouvez aussi saisir l&apos;Autorité de protection des données personnelles (APDP) du Bénin si vous estimez que vos droits ne sont pas respectés.</p>
          <h2>8. Cookies et Meta Pixel</h2>
          <p>Si vous l&apos;acceptez, nous utilisons le Meta Pixel pour mesurer les inscriptions et améliorer nos publicités. Vous pouvez refuser, et la page fonctionne normalement sans.</p>
          <h2>9. Sécurité</h2>
          <p>Nous prenons des mesures raisonnables pour protéger vos données (connexion HTTPS, accès restreint). Aucun système n&apos;est totalement infaillible.</p>
          <h2>10. Modifications</h2>
          <p>Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de la page.</p>
          <p><strong>Contact : novenetech@gmail.com</strong></p>
        </article>
      </div>
    </main>
  );
}
