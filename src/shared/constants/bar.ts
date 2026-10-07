/** Valeurs de la restauration, du bar et du stock du gîte — à modifier ici uniquement. */

/** Les parties de l'écran Restauration et bar : la restauration d'abord, puis le bar (le stock a son onglet en bas). */
export const ONGLET_BAR = {
  RESTAURATION: 'restauration',
  BAR: 'bar',
} as const;

/** Le nombre maximum d'une même boisson sur un ticket du bar (la quantité se choisit de 1 à ce nombre). */
export const NOMBRE_MAX_BOISSONS_TICKET = 50;

/** D'où vient un mouvement de l'inventaire du gîte : une saisie, un ticket du bar, un achat de marchandises. */
export const ORIGINE_MOUVEMENT_GITE = {
  MANUEL: 'manuel',
  VENTE: 'vente',
  ACHAT: 'achat',
} as const;

/** Le choix « toutes les activités » du filtre du stock d'un gîte (sinon : une rubrique du gîte). */
export const FILTRE_RUBRIQUE_TOUT = 'tout';

/** Le filtre du stock d'un gîte sur le bar (la rubrique « bar » des marchandises). */
export const FILTRE_RUBRIQUE_BAR = 'bar';

/**
 * Les sections du stock d'un gîte : les boissons et la nourriture (qui se vendent), le matériel, le conditionnement et
 * l'entretien. Chacune a sa liste et son ordre ; les catégories de l'inventaire les rangent comme la comptabilité.
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
