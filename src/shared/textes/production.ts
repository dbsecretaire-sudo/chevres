/** Textes de l'interface — l'onglet Production (fromages, viande vendue, contrôle laitier, groupements). À modifier ici uniquement. */
export const TEXTES_PRODUCTION = {
  titre: 'Production',
  /** Les lignes de l'écran d'accueil de l'onglet. */
  accueil: {
    fromages: { titre: 'Fromages', aide: 'Les fromages par lot : fabrication, vente, rappels.' },
    viande: { titre: 'Viande', aide: 'Les ventes de viande de l’année.' },
    charcuterie: {
      titre: 'Boucherie / Charcuterie',
      aide: 'La boucherie et la charcuterie par lot : fabrication, vente, rappels.',
    },
    laitier: {
      titre: 'Contrôle laitier',
      aide: 'Les contrôles de la production et de la qualité du lait, et les analyses.',
    },
    groupements: { titre: 'Groupements', aide: 'Adhésion, achats groupés, actions spécifiques.' },
    rappels: {
      titre: 'Rappels de lots',
      aide: 'Les lots vendus à rappeler (contrôle non ok) et ceux déjà rappelés.',
    },
  },
  /** La section des rappels de lots : à rappeler, puis rappelés (fromages et charcuterie). */
  rappelsLots: {
    titre: 'Rappels de lots',
    aucun: 'Aucun lot à rappeler ni rappelé.',
    aRappeler: (date: string) => `À rappeler · vendu le ${date}`,
    rappele: (date: string) => `Rappelé le ${date}`,
    rappeleValide: (date: string, validation: string) => `Rappelé le ${date} · validé le ${validation}`,
    valide: 'Rappel validé',
    validerLeRappel: 'Valider ce rappel',
    validerQuestion: (lot: string) => `Valider le rappel du lot ${lot} ?`,
    validerMessage: 'Le rappel sera marqué comme fait.',
    valider: 'Valider',
    /** Le détail d'un lot : le lot, sa facture et le client à contacter. */
    detail: {
      lot: 'Lot',
      fabrication: 'Fabriqué le',
      vente: 'Vendu le',
      rappel: 'Rappel',
      aRappeler: 'À rappeler',
      valideLe: (date: string) => `validé le ${date}`,
      controle: 'Contrôle',
      controleOk: 'Ok',
      controleNonOk: 'Non ok',
      facture: 'Facture',
      pasVendu: 'Ce lot n’a pas été vendu.',
      venteIntrouvable: 'La vente de ce lot est introuvable.',
      numeroFacture: 'N° de facture',
      venteDu: 'Vente du',
      montant: 'Montant',
      ouvrirLaFicheClient: 'Ouvrir la fiche client',
      client: 'Client à contacter',
      nom: 'Nom',
      telephone: 'Téléphone',
      email: 'E-mail',
      adresse: 'Adresse',
      pasDeFiche: 'Aucune fiche client à ce nom : le nom vient de la vente.',
      fermer: 'Fermer',
    },
  },
  /** La liste des fromages : un par type, avec ses lots. */
  fromages: {
    titre: 'Fromages',
    aucun: 'Aucun fromage suivi : fabriquez-en avec le bouton +.',
    ajouter: { titre: 'Ajouter un fromage', exemple: 'ex : Tomme' },
    fabriquer: 'Fabriquer des fromages',
    rappeler: 'Rappeler des fromages',
    statistiques: 'Statistiques de lait',
    ligne: (enStock: number, total: number) => `${enStock} en stock · ${total} lot${total > 1 ? 's' : ''}`,
  },
  /** La liste de la boucherie / charcuterie : un produit par ligne de l'inventaire, avec ses lots. */
  charcuterie: {
    titre: 'Boucherie / Charcuterie',
    aucun: 'Aucun produit suivi : ajoutez-en avec le bouton +, puis fabriquez-en.',
    ajouter: { titre: 'Ajouter un produit', exemple: 'ex : Saucisson' },
    fabriquer: 'Fabriquer des produits',
    rappeler: 'Rappeler des produits',
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
    quantiteRequise: 'Indiquez le nombre de produits fabriqués.',
    premierRequis: 'Indiquez le n° du premier lot (il se termine par un chiffre).',
    tropDeLots: (max: number) => `Une fabrication ne peut pas dépasser ${max} produits.`,
    dejaPris: (numero: string) => `Le lot ${numero} existe déjà pour ce produit.`,
  },
  /** La fabrication de charcuterie : mêmes champs, sans le lait. */
  fabricationCharcuterie: {
    titre: 'Fabriquer des produits',
    type: 'Produit',
    date: 'Date de fabrication',
    quantite: 'Nombre de produits',
    premier: 'N° du premier lot',
    premierAide: 'Chaque produit a son numéro de lot, à la suite du premier.',
    dernier: (numero: string) => `Dernier lot : ${numero}`,
    enregistrer: 'Fabriquer',
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
  /** Le rappel de charcuterie. */
  rappelCharcuterie: {
    titre: 'Rappeler des produits',
    type: 'Produit',
    date: 'Date du rappel',
    aucun: 'Aucun lot à rappeler : seuls les produits vendus dont le contrôle n’est pas ok peuvent l’être.',
    choisir: 'Choisissez les lots à rappeler.',
    enregistrer: (nombre: number) => `Rappeler ${nombre} lot${nombre > 1 ? 's' : ''}`,
    aide: 'Seuls les produits vendus dont le contrôle n’est pas ok sont proposés. Un produit rappelé est marqué « Rappelé » dans l’inventaire.',
  },
  /** La viande vendue de l'année. */
  viande: {
    titre: 'Viande vendue',
    rappeler: 'Rappeler des lots',
    aucune: 'Aucune vente de viande cette année',
    total: (montant: string) => `Total : ${montant}`,
  },
} as const;
