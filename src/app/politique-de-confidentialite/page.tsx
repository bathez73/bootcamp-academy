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
          <p className="masterclass-policy-date">Dernière mise à jour : 20 octobre 2026</p>
        </header>
        <article className="masterclass-policy-copy">
          <h2>1. Qui est responsable de vos données ?</h2>
          <p>Les données collectées sur cette page sont traitées par Novenetech (NOVENE TECH), établissement exploité en nom propre par Kallon Bathez Odjegnide Bankole, situé à Sèmè-Podji (Ouémé), Bénin. IFU : 0202315600488 · RCCM : RB/PNO/26 A 125964. Contact : novenetech@gmail.com</p>
          <h2>2. Quelles données collectons-nous ?</h2>
          <ul><li>Nom complet</li><li>Adresse e-mail</li><li>Numéro WhatsApp (avec indicatif du pays)</li><li>Données techniques de navigation (type d&apos;appareil, pages consultées, source de visite).</li></ul>
          <h2>3. Pourquoi les utilisons-nous ?</h2>
          <ul><li>Gérer votre réservation à la masterclass « De 0 à ton premier client digital ».</li><li>Vous envoyer par e-mail et par WhatsApp le lien d&apos;accès, les rappels et les informations pratiques liées à cet événement.</li><li>Si vous y avez consenti, vous informer de nos futures formations et offres.</li><li>Mesurer l&apos;audience de la page et l&apos;efficacité de nos publicités (Meta Pixel).</li></ul>
          <h2>4. Sur quelle base ?</h2>
          <p>L’accord donné dans le formulaire concerne l’organisation de la masterclass. L’accord facultatif pour recevoir de futures offres est distinct. La mesure publicitaire de la masterclass se déclenche automatiquement, sans demande d’acceptation des cookies. Elle ne constitue pas un accord aux communications commerciales.</p>
          <p>Nous comptabilisons aussi les inscriptions réellement enregistrées pour gérer l’événement.</p>
          <h2>5. Qui reçoit vos données ?</h2>
          <p>Novenetech et ses prestataires techniques strictement nécessaires : hébergement du site, outil d&apos;envoi d&apos;e-mails, WhatsApp (Meta), plateforme de visioconférence. Nous ne vendons pas vos données. Certains prestataires peuvent être situés hors du Bénin ; dans ce cas, nous veillons à ce qu&apos;ils offrent des garanties de protection suffisantes.</p>
          <p>Sur la masterclass, Meta reçoit automatiquement des données techniques de navigation, dont l’adresse IP et les pages consultées, ainsi qu’un événement lors d’une nouvelle inscription confirmée. Le code du site ne lui transmet pas les champs nom, e-mail et WhatsApp du formulaire. Cette mesure n’est pas présentée comme anonyme.</p>
          <h2>6. Combien de temps les conservons-nous ?</h2>
          <p>Pendant la durée nécessaire à l&apos;organisation de la masterclass, puis 12 mois maximum après votre dernière interaction, sauf si vous demandez leur suppression avant.</p>
          <h2>7. Vos droits</h2>
          <p>Conformément à la législation béninoise sur la protection des données personnelles, vous pouvez à tout moment : accéder à vos données, les rectifier, les supprimer, vous opposer à leur traitement, retirer votre consentement ou demander leur portabilité. Écrivez à novenetech@gmail.com ; nous répondons dans un délai raisonnable. Vous pouvez aussi saisir l&apos;Autorité de protection des données personnelles (APDP) du Bénin si vous estimez que vos droits ne sont pas respectés.</p>
          <h2>8. Cookies et Meta Pixel</h2>
          <p>Sur la page masterclass, le Meta Pixel est chargé automatiquement : PageView mesure chaque visite et Lead mesure une nouvelle inscription confirmée. Les erreurs et les inscriptions déjà enregistrées ne déclenchent pas de Lead. Meta peut déposer ses cookies publicitaires et recevoir des données techniques de navigation.</p>
          <p>Les paramètres UTM de la campagne peuvent être mémorisés pendant la session et associés à votre inscription. Votre nom, votre e-mail et votre numéro WhatsApp ne sont pas ajoutés aux événements du Pixel. La Conversions API de Meta n’est pas activée.</p>
          <p>Sur les pages de formation, le bandeau propose « Tout accepter », « Tout refuser » et « Personnaliser ». Le choix est conservé pendant 180 jours et peut être modifié avec « Gérer mes cookies ». Ce choix concerne les pages de formation ; la masterclass utilise la mesure automatique décrite ci-dessus.</p>
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
