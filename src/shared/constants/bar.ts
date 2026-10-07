/** Valeurs de la restauration, du bar et du stock du gîte — à modifier ici uniquement. */

/** D'où vient un mouvement de l'inventaire du gîte : une saisie, un ticket du bar, un achat de marchandises. */
export const ORIGINE_MOUVEMENT_GITE = {
  MANUEL: 'manuel',
  VENTE: 'vente',
  ACHAT: 'achat',
} as const;

/** Le choix « toutes les activités » du filtre du stock d'un gîte (sinon : une rubrique du gîte). */
export const FILTRE_RUBRIQUE_TOUT = 'tout';

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
