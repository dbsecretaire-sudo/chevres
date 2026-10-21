import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

/** Les catégories de fournisseur (de tiers) proposées d'office : l'utilisateur peut les renommer, en ajouter ou en retirer (voir categoriesFournisseur). */
export const CATEGORIE_FOURNISSEUR = {
  /** Un fournisseur sans catégorie particulière : toutes les dépenses lui conviennent. */
  GENERAL: 'general',
  /** Un vétérinaire : ses factures sont des dépenses vétérinaires, rien d'autre. */
  VETERINAIRE: 'veterinaire',
  /** L'État (impôts, taxes) : ses factures sont des impôts et taxes. */
  ETAT: 'etat',
  /** Les fournisseurs d'aliments pour les animaux : leurs factures sont de l'alimentation. */
  ALIMENTS: 'aliments',
  /** Une station-service : du carburant. */
  CARBURANT: 'carburant',
  /** Un garage, un réparateur : des réparations. */
  GARAGE: 'garage',
  /** Un organisme (MSA, GDS, chambre d'agriculture…) : des cotisations ou une dépense à part. */
  ORGANISME: 'organisme',
  /** La chambre d'agriculture : ses factures sont des dépenses à part (« Autre ») ou des achats de production (les boucles d'identification qu'elle fournit). */
  CHAMBRE_AGRICULTURE: 'chambre_agriculture',
  /** Un groupement (GDS, achats groupés…) : ses factures sont des cotisations ou des achats, de n'importe quelle dépense. */
  GROUPEMENT: 'groupement',
  /** Le groupement sanitaire (GDS) : un partenaire d'office ; il figure dans les coordonnées utiles du carnet de mise bas. */
  GROUPEMENT_SANITAIRE: 'groupement_sanitaire',
  /** Un laboratoire d'analyses (du lait, de la prophylaxie…) : ses factures sont des analyses de laboratoire ; il se choisit sur chaque analyse. */
  LABORATOIRE: 'laboratoire',
  /** Un abattoir : ses factures (frais d'abattage) se lient aux lots d'abattoir pour être refacturées au client. */
  ABATTOIR: 'abattoir',
  /** Un équarrisseur (ATM…) : il s'affiche dans Groupements avec ses coordonnées, ses contrats, ses factures et ses promotions. */
  EQUARRISSAGE: 'equarrissage',
  ASSUREUR: 'assureur',
  BANQUE: 'banque',
  /** Un fournisseur d'emballages (barquettes, sacs, étiquettes…) : il intervient dans le travail du produit. */
  EMBALLAGES: 'emballages',
  /** Un office de tourisme ou un partenaire qui envoie des visiteurs (agritourisme). */
  TOURISME: 'tourisme',
  /** Un fournisseur du repas servi aux visiteurs (ingrédients, boissons) : il intervient dans l'agritourisme. */
  REPAS: 'repas',
  /** Un fournisseur qui ne remet pas de facture : ses dépenses sont notées « non facturées » (pas de TVA à déduire). */
  NON_FACTURABLE: 'non_facturable',
} as const;

/** La catégorie d'un fournisseur dont la fiche n'en a pas (ou dont la catégorie a été retirée) : elle ne se retire pas de la liste. */
export const CATEGORIE_FOURNISSEUR_PAR_DEFAUT = CATEGORIE_FOURNISSEUR.GENERAL;

/** Les catégories qui ne se retirent pas : celle d'office, et celles dont les dépenses vétérinaires, les impôts et les équarrisseurs ont besoin. */
export const CATEGORIES_FOURNISSEUR_PROTEGEES: readonly string[] = [
  CATEGORIE_FOURNISSEUR_PAR_DEFAUT,
  CATEGORIE_FOURNISSEUR.VETERINAIRE,
  CATEGORIE_FOURNISSEUR.ETAT,
  CATEGORIE_FOURNISSEUR.EQUARRISSAGE,
  CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE,
  // Le choix du laboratoire d'une analyse du lait en dépend.
  CATEGORIE_FOURNISSEUR.LABORATOIRE,
  CATEGORIE_FOURNISSEUR.ABATTOIR,
  // Le bouton « Emballages » du travail du produit en dépend : la catégorie est toujours dans la liste, même enregistrée avant son arrivée.
  CATEGORIE_FOURNISSEUR.EMBALLAGES,
  // Les logos du côté Agritourisme de l'accueil en dépendent aussi.
  CATEGORIE_FOURNISSEUR.TOURISME,
  CATEGORIE_FOURNISSEUR.REPAS,
];

/** Les dépenses d'office d'un vétérinaire. Les autres catégories n'en limitent aucune, sauf réglage contraire. */
export const DEPENSES_VETERINAIRE: readonly string[] = [CATEGORIE_DEPENSE.VETERINAIRE];

/** Les dépenses d'office de l'État : les impôts et taxes. */
export const DEPENSES_ETAT: readonly string[] = [CATEGORIE_DEPENSE.IMPOTS];

/**
 * Les dépenses d'office des autres catégories proposées. Chacune garde « Autre », qui existe pour tout établissement : un fournisseur
 * a toujours au moins une dépense à choisir.
 */
export const DEPENSES_PAR_CATEGORIE_FOURNISSEUR: Record<string, readonly string[]> = {
  [CATEGORIE_FOURNISSEUR.ALIMENTS]: [CATEGORIE_DEPENSE.ALIMENTATION],
  [CATEGORIE_FOURNISSEUR.CARBURANT]: [CATEGORIE_DEPENSE.CARBURANT],
  [CATEGORIE_FOURNISSEUR.GARAGE]: [CATEGORIE_DEPENSE.REPARATION],
  [CATEGORIE_FOURNISSEUR.ORGANISME]: [
    CATEGORIE_DEPENSE.COTISATIONS_SOCIALES,
    CATEGORIE_DEPENSE.IMPOTS,
    CATEGORIE_DEPENSE.AUTRE,
  ],
  [CATEGORIE_FOURNISSEUR.CHAMBRE_AGRICULTURE]: [CATEGORIE_DEPENSE.AUTRE, CATEGORIE_DEPENSE.PRODUCTION],
  [CATEGORIE_FOURNISSEUR.ASSUREUR]: [CATEGORIE_DEPENSE.ASSURANCES, CATEGORIE_DEPENSE.AUTRE],
  [CATEGORIE_FOURNISSEUR.LABORATOIRE]: [CATEGORIE_DEPENSE.ANALYSES_LABORATOIRE, CATEGORIE_DEPENSE.AUTRE],
  [CATEGORIE_FOURNISSEUR.BANQUE]: [CATEGORIE_DEPENSE.FRAIS_BANCAIRES, CATEGORIE_DEPENSE.AUTRE],
  [CATEGORIE_FOURNISSEUR.EMBALLAGES]: [CATEGORIE_DEPENSE.PRODUCTION, CATEGORIE_DEPENSE.AUTRE],
  [CATEGORIE_FOURNISSEUR.TOURISME]: [CATEGORIE_DEPENSE.AUTRE],
  [CATEGORIE_FOURNISSEUR.REPAS]: [CATEGORIE_DEPENSE.PRODUCTION, CATEGORIE_DEPENSE.AUTRE],
};
