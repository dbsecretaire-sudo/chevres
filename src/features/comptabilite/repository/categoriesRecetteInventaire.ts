import { lireArchiveStock } from '@/features/stock/repository';
import {
  definirCategoriesAjoutees,
  type CategorieAjoutee,
} from '@/features/comptabilite/utils/categoriesRecetteInventaire';
import { CATEGORIE_INVENTAIRE } from '@/shared/constants/stock';

/** Les catégories d'inventaire dont les listes se vendent : leurs listes ajoutées sont des catégories de recette. */
const CATEGORIES_VENDUES: readonly string[] = [
  CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
  CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX,
];

/**
 * Relit la structure de l'inventaire de l'établissement actif et met en mémoire ses listes ajoutées sous « Produits finis » et
 * « Produits animaux » : la liste « Catégorie de recette » d'une nouvelle écriture les propose, avec leur compte.
 */
export async function chargerCategoriesRecetteInventaire(): Promise<CategorieAjoutee[]> {
  const archive = await lireArchiveStock();
  const categories = (archive.listes ?? [])
    .filter((l) => CATEGORIES_VENDUES.includes(l.categorie))
    .map((l) => ({ id: l.id, nom: l.nom, compte: l.compte }));
  definirCategoriesAjoutees(categories);
  return categories;
}
