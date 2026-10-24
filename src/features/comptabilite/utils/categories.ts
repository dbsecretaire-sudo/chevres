import type { CategorieDepense } from '@/features/comptabilite/types';
import { ORDRE_CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';

/** Les catégories de dépense proposées par l'exploitation. */
export const categoriesDepenseDuMode = (): readonly CategorieDepense[] => ORDRE_CATEGORIE_DEPENSE;
