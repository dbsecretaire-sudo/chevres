import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/**
 * Les ateliers de l'exploitation, pour suivre la marge de chacun : le lait, le fromage, les petits (chevreaux, agneaux…), les
 * animaux vendus pour l'élevage (reproducteurs, réformes), la viande et la charcuterie, les œufs, et le reste.
 */
export const ATELIER = {
  LAIT: 'lait',
  FROMAGE: 'fromage',
  PETITS: 'petits',
  ANIMAUX: 'animaux',
  VIANDE: 'viande',
  OEUFS: 'oeufs',
  AUTRES: 'autres',
} as const;

export type Atelier = ValeurDe<typeof ATELIER>;

/** L'atelier d'une vente d'après sa catégorie. */
export const ATELIER_PAR_CATEGORIE_VENTE: Record<ValeurDe<typeof CATEGORIE_VENTE>, Atelier> = {
  [CATEGORIE_VENTE.LAIT]: ATELIER.LAIT,
  [CATEGORIE_VENTE.FROMAGE]: ATELIER.FROMAGE,
  [CATEGORIE_VENTE.CABRIS]: ATELIER.PETITS,
  [CATEGORIE_VENTE.VIANDE]: ATELIER.VIANDE,
  [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE]: ATELIER.VIANDE,
  [CATEGORIE_VENTE.ANIMAL_MORT]: ATELIER.VIANDE,
  [CATEGORIE_VENTE.ANIMAL_SUR_PIED]: ATELIER.ANIMAUX,
  [CATEGORIE_VENTE.ANIMAL_VIVANT]: ATELIER.ANIMAUX,
  [CATEGORIE_VENTE.OEUFS]: ATELIER.OEUFS,
};

/** Les ateliers du lait : le coût de production du litre se calcule sur leurs charges. */
export const ATELIERS_DU_LAIT: readonly Atelier[] = [ATELIER.LAIT, ATELIER.FROMAGE];
