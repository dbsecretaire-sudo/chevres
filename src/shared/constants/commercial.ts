import type { ValeurDe } from '@/shared/constants/valeurDe';

/** L'onglet Commercial d'un élevage : circuits de vente, commandes, tarifs — à modifier ici uniquement. */

/** Les circuits par lesquels une vente passe (le champ « Circuit de vente » d'une vente). */
export const CIRCUIT_VENTE = {
  FERME: 'ferme',
  MARCHE: 'marche',
  PANIER: 'panier',
  RESTAURATEUR: 'restaurateur',
  MAGASIN: 'magasin',
  GROSSISTE: 'grossiste',
  EN_LIGNE: 'en_ligne',
  AUTRE: 'autre',
} as const;

/** Le regroupement des ventes dont le circuit n'est pas renseigné (les ventes d'avant ce champ). */
export const CIRCUIT_NON_RENSEIGNE = 'non_renseigne';

/** Les étapes d'une commande de client. */
export const STATUT_COMMANDE = {
  A_PREPARER: 'a_preparer',
  PREPAREE: 'preparee',
  LIVREE: 'livree',
  ANNULEE: 'annulee',
} as const;

export type StatutCommande = ValeurDe<typeof STATUT_COMMANDE>;

/** Les commandes qu'il reste à préparer ou à livrer : celles que la liste montre d'abord. */
export const STATUTS_COMMANDE_OUVERTE: readonly StatutCommande[] = [
  STATUT_COMMANDE.A_PREPARER,
  STATUT_COMMANDE.PREPAREE,
];

/** Un client sans achat depuis ce nombre de jours est proposé à la relance. */
export const JOURS_CLIENT_A_RELANCER = 90;

/** Le jour de la prochaine livraison d'une commande qu'on crée : dans ce nombre de jours. */
export const JOURS_AVANT_LIVRAISON = 3;

/** Les vues de l'écran « Ventes et clients ». */
export const VUE_VENTES = {
  PRODUITS: 'produits',
  CLIENTS: 'clients',
  MOIS: 'mois',
} as const;

export type VueVentes = ValeurDe<typeof VUE_VENTES>;

/** Ce que l'atelier vend (le lien `?perimetre=atelier` de l'écran des ventes) : les produits finis, sans le lait, les animaux ni les œufs. */
export const PERIMETRE_VENTES_ATELIER = 'atelier';
/** Le lien `?perimetre=agritourisme` de l'écran des ventes : les visites réalisées (formules, groupes, personnes). */
export const PERIMETRE_VENTES_AGRITOURISME = 'agritourisme';
export const CATEGORIES_VENTE_ATELIER: readonly string[] = ['fromage', 'viande', 'boucherie_charcuterie'];

/** Le nom du fichier du bon de livraison (PDF) ; le numéro de la commande s'y ajoute. */
export const NOM_FICHIER_BON_LIVRAISON = 'bon_livraison';

/** Le début du numéro d'une commande (« C-2026-004 »). */
export const PREFIXE_NUMERO_COMMANDE = 'C';
