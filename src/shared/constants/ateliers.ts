import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
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
  /** Les plats préparés (conserves, bocaux) fabriqués à l'atelier. */
  PLATS: 'plats',
  /** Les savons au lait de chèvre (cosmétique). */
  SAVONS: 'savons',
  OEUFS: 'oeufs',
  /** Les visites de la ferme, le 4x4, les repas et la dégustation : une recette « autre » rangée dans cet atelier. */
  AGRITOURISME: 'agritourisme',
  AUTRES: 'autres',
} as const;

export type Atelier = ValeurDe<typeof ATELIER>;

/**
 * Les ateliers qu'une charge peut concerner pour une espèce : pas d'œufs pour des chèvres, pas de lait ni de fromage pour
 * des poules ou des cochons. « Autres recettes » n'est pas un atelier de production.
 */
export function ateliersDeLEspece(espece?: string): Atelier[] {
  switch (espece) {
    case TYPE_ANIMAL_ETABLISSEMENT.POULES:
      return [ATELIER.OEUFS, ATELIER.ANIMAUX, ATELIER.VIANDE, ATELIER.PLATS, ATELIER.AGRITOURISME];
    case TYPE_ANIMAL_ETABLISSEMENT.COCHONS:
      return [ATELIER.PETITS, ATELIER.ANIMAUX, ATELIER.VIANDE, ATELIER.PLATS, ATELIER.AGRITOURISME];
    case TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES:
      return [ATELIER.AGRITOURISME];
    default:
      return [
        ATELIER.LAIT,
        ATELIER.FROMAGE,
        ATELIER.PETITS,
        ATELIER.ANIMAUX,
        ATELIER.VIANDE,
        ATELIER.PLATS,
        ATELIER.SAVONS,
        ATELIER.AGRITOURISME,
      ];
  }
}

/** L'atelier d'une vente d'après sa catégorie. */
export const ATELIER_PAR_CATEGORIE_VENTE: Record<ValeurDe<typeof CATEGORIE_VENTE>, Atelier> = {
  [CATEGORIE_VENTE.LAIT]: ATELIER.LAIT,
  [CATEGORIE_VENTE.FROMAGE]: ATELIER.FROMAGE,
  [CATEGORIE_VENTE.CABRIS]: ATELIER.PETITS,
  [CATEGORIE_VENTE.VIANDE]: ATELIER.VIANDE,
  [CATEGORIE_VENTE.BOUCHERIE_CHARCUTERIE]: ATELIER.VIANDE,
  [CATEGORIE_VENTE.SAVONS]: ATELIER.SAVONS,
  [CATEGORIE_VENTE.ANIMAL_MORT]: ATELIER.VIANDE,
  [CATEGORIE_VENTE.ANIMAL_SUR_PIED]: ATELIER.ANIMAUX,
  [CATEGORIE_VENTE.ANIMAL_VIVANT]: ATELIER.ANIMAUX,
  [CATEGORIE_VENTE.OEUFS]: ATELIER.OEUFS,
};

/** Les ateliers du lait : le coût de production du litre se calcule sur leurs charges. */
