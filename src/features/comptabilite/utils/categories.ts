import type { CategorieDepense } from '@/features/comptabilite/types';
import {
  CATEGORIES_DEPENSE_ENTREPRISE,
  CATEGORIES_DEPENSE_FINANCE,
  ORDRE_CATEGORIE_DEPENSE,
} from '@/shared/constants/comptabilite';
import {
  activiteFinanciereSeule,
  avecActiviteFinanciere,
  modeEntreprise,
} from '@/shared/dictionnaire/entreprise';

/** Les catégories de dépense proposées : celles d'une entreprise, ou celles d'un élevage. */
export const categoriesDepenseDuMode = (): readonly CategorieDepense[] =>
  activiteFinanciereSeule()
    ? CATEGORIES_DEPENSE_FINANCE
    : modeEntreprise()
      ? [...CATEGORIES_DEPENSE_ENTREPRISE, ...(avecActiviteFinanciere() ? CATEGORIES_DEPENSE_FINANCE : [])]
      : ORDRE_CATEGORIE_DEPENSE;
