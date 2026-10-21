import { GROUPE_RECETTE } from '@/shared/constants/comptabilite';

/** Les catégories de client proposées d'office (l'utilisateur peut les renommer, en ajouter ou en retirer : voir categoriesClient). */
export const CATEGORIE_CLIENT = {
  PARTICULIER: 'particulier',
  RECOLTEUR: 'recolteur',
  ORGANISME: 'organisme',
  ENTREPRISE: 'entreprise',
  /** Une grande ou moyenne surface, un magasin : un client du travail du produit, comme un particulier ou une entreprise. */
  SURFACE_COMMERCIALE: 'surface_commerciale',
  /** Un groupement (GDS, achat groupé…) : les groupements du volet Production se choisissent parmi les clients de cette catégorie. */
  GROUPEMENT: 'groupement',
  /** Un visiteur de la ferme (agritourisme) : un particulier qui vient visiter, manger ou déguster. */
  VISITEUR: 'visiteur',
  /** Un groupe de visiteurs (scolaires, comité d'entreprise, association) : il réserve une visite pour plusieurs personnes. */
  GROUPE_VISITEURS: 'groupe_visiteurs',
} as const;

/** Les groupes de recette qui ne viennent d'aucun client (les opérations du journal de trading) : toujours proposés. */
export const GROUPES_RECETTE_SANS_CLIENT: readonly string[] = [
  GROUPE_RECETTE.GAINS_TRADING,
  GROUPE_RECETTE.DEPOT,
];

/** Les recettes d'office d'un organisme : une aide, ou une facture de prestations — rien d'autre. */
export const GROUPES_RECETTE_ORGANISME: readonly string[] = [GROUPE_RECETTE.AIDE, GROUPE_RECETTE.PRESTATIONS];

/** La catégorie d'un client dont la fiche n'en a pas (ou dont la catégorie a été retirée) : elle ne se retire pas de la liste. */
export const CATEGORIE_CLIENT_PAR_DEFAUT = CATEGORIE_CLIENT.PARTICULIER;

/**
 * Les catégories qui ne se retirent pas de la liste : celle d'office des clients, celle dont les groupements ont besoin, et celles des clients
 * du travail du produit (particulier, surface commerciale, entreprise), qui ont chacune leur bouton sur l'accueil.
 */
export const CATEGORIES_CLIENT_PROTEGEES: readonly string[] = [
  CATEGORIE_CLIENT_PAR_DEFAUT,
  CATEGORIE_CLIENT.GROUPEMENT,
  CATEGORIE_CLIENT.ENTREPRISE,
  CATEGORIE_CLIENT.SURFACE_COMMERCIALE,
  // Les visiteurs et leurs groupes ont chacun leur logo sur le côté Agritourisme de l'accueil.
  CATEGORIE_CLIENT.VISITEUR,
  CATEGORIE_CLIENT.GROUPE_VISITEURS,
];

/** Ce que peut contenir le numéro de facture d'un client dont la catégorie n'est pas « libre » : chiffres, tirets, barres et points. */
export const MOTIF_NUMERO_FACTURE_NUMERIQUE = /^[0-9\-/. ]*$/;
