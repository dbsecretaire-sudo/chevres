/** Valeurs de la restauration, du bar et du stock du gîte — à modifier ici uniquement. */

/** Les parties de l'écran Restauration et bar : la restauration d'abord, puis le bar (le stock a son onglet en bas). */
export const ONGLET_BAR = {
  RESTAURATION: 'restauration',
  BAR: 'bar',
} as const;

/** Le nombre maximum d'une même boisson sur un ticket du bar (la quantité se choisit de 1 à ce nombre). */
export const NOMBRE_MAX_BOISSONS_TICKET = 50;

/** Le choix « toutes les activités » du filtre du stock d'un gîte (sinon : une rubrique du gîte). */
export const FILTRE_RUBRIQUE_TOUT = 'tout';

/** Les trois onglets du stock d'un gîte, rangés par nature : ce qui se vend, ce qui se consomme, les investissements. */
export const ONGLET_STOCK_GITE = {
  VENTE: 'vente',
  CONSOMMABLES: 'consommables',
  INVESTISSEMENTS: 'investissements',
} as const;

/**
 * Les sections du stock d'un gîte : les boissons et la nourriture (qui se vendent), le matériel, le conditionnement et
 * l'entretien. Chacune a sa liste et son ordre ; les trois onglets les rangent par nature.
 */
export const ONGLET_STOCK_BAR = {
  CONSOMMABLES: 'consommables',
  MATERIEL: 'materiel',
  CONDITIONNEMENT: 'conditionnement',
  ENTRETIEN: 'entretien',
} as const;

/** Les catégories d'articles du stock d'un gîte qui ne sont ni des boissons ni des aliments. */
export const CATEGORIE_ARTICLE_GITE = {
  MATERIEL: 'materiel',
  CONDITIONNEMENT: 'conditionnement',
  ENTRETIEN: 'entretien',
} as const;
