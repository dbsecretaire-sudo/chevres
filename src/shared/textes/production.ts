/** Textes de l'interface — l'onglet Production (fromages, viande vendue, contrôle laitier, groupements). À modifier ici uniquement. */
export const TEXTES_PRODUCTION = {
  titre: 'Production',
  /** Les lignes de l'écran d'accueil de l'onglet. */
  accueil: {
    fromages: { titre: 'Fromages', aide: 'Les fromages par lot : fabrication, vente, rappels.' },
    viande: { titre: 'Viande vendue', aide: 'Les ventes de viande et de charcuterie de l’année.' },
    laitier: {
      titre: 'Contrôle laitier',
      aide: 'Les contrôles de la production et de la qualité du lait, et les analyses.',
    },
    groupements: { titre: 'Groupements', aide: 'Adhésion, achats groupés, actions spécifiques.' },
  },
  /** La liste des fromages : un par type, avec ses lots. */
  fromages: {
    titre: 'Fromages',
    aucun: 'Aucun fromage suivi : fabriquez-en avec le bouton +.',
    fabriquer: 'Fabriquer des fromages',
    rappeler: 'Rappeler des fromages',
    statistiques: 'Statistiques de lait',
    ligne: (enStock: number, total: number) => `${enStock} en stock · ${total} lot${total > 1 ? 's' : ''}`,
  },
  /** La fabrication : des fromages numérotés à la suite, qui entrent au stock. */
  fabrication: {
    titre: 'Fabriquer des fromages',
    type: 'Fromage',
    date: 'Date de fabrication',
    quantite: 'Nombre de fromages',
    premier: 'N° du premier lot',
    premierAide: 'Chaque fromage a son numéro de lot, à la suite du premier.',
    dernier: (numero: string) => `Dernier lot : ${numero}`,
    litres: 'Litres de lait utilisés (facultatif)',
    enregistrer: 'Fabriquer',
    quantiteRequise: 'Indiquez le nombre de fromages fabriqués.',
    premierRequis: 'Indiquez le n° du premier lot (il se termine par un chiffre).',
    tropDeLots: (max: number) => `Une fabrication ne peut pas dépasser ${max} fromages.`,
    dejaPris: (numero: string) => `Le lot ${numero} existe déjà pour ce fromage.`,
  },
  /** Le rappel : des fromages retirés de la vente. */
  rappel: {
    titre: 'Rappeler des fromages',
    type: 'Fromage',
    date: 'Date du rappel',
    aucun: 'Aucun lot à rappeler : seuls les fromages vendus dont le contrôle n’est pas ok peuvent l’être.',
    choisir: 'Choisissez les lots à rappeler.',
    enregistrer: (nombre: number) => `Rappeler ${nombre} lot${nombre > 1 ? 's' : ''}`,
    aide: 'Seuls les fromages vendus dont le contrôle n’est pas ok sont proposés. Un fromage rappelé est marqué « Rappelé » dans l’inventaire.',
  },
  /** La viande vendue de l'année. */
  viande: {
    titre: 'Viande vendue',
    aucune: 'Aucune vente de viande cette année',
    total: (montant: string) => `Total : ${montant}`,
  },
} as const;
