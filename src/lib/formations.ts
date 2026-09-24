export type Formation = {
  nom: string;
  promesse: string;
  prix: number;
  file: string;
};

export const FORMATIONS: Formation[] = [
  {
    nom: 'IA & Automatisation pour PME',
    promesse: 'Automatisez 3 à 5 tâches réelles de votre entreprise en 5 semaines. Support écrit complet, aucun prérequis technique.',
    prix: 89000,
    file: '01_ia_automatisation_pme.pdf',
  },
  {
    nom: 'Marketing Digital orienté Ventes',
    promesse: "Construisez en 4 semaines votre système d'acquisition, de suivi et de conversion de clients.",
    prix: 49000,
    file: '02_marketing_digital_ventes.pdf',
  },
  {
    nom: 'Digitaliser son Entreprise',
    promesse: "Outils, CRM, processus et paiement en ligne. La passerelle vers un vrai système d'encaissement digital.",
    prix: 69000,
    file: '03_digitaliser_son_entreprise.pdf',
  },
];

export const FORMATIONS_MAP: Record<string, { price: number; file: string }> = Object.fromEntries(
  FORMATIONS.map((f) => [f.nom, { price: f.prix, file: f.file }]),
);