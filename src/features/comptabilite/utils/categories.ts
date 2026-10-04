import type { CategorieDepense } from '@/features/comptabilite/types';
import { CATEGORIES_DEPENSE_ENTREPRISE, ORDRE_CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

/** Les catégories de dépense proposées : celles d'une entreprise, ou celles d'un élevage. */
export const categoriesDepenseDuMode = (): readonly CategorieDepense[] =>
  modeEntreprise() ? CATEGORIES_DEPENSE_ENTREPRISE : ORDRE_CATEGORIE_DEPENSE;
