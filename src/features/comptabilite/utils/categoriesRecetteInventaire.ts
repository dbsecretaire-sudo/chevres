/** Le début de l'identifiant d'une catégorie de recette qui vient d'une liste de l'inventaire (le reste est l'identifiant de la liste). */
export const PREFIXE_CATEGORIE_AJOUTEE = 'perso:';

/** Une catégorie de recette ajoutée : une liste de l'inventaire (35. Produits finis, 33. Produits animaux) et son compte. */
export interface CategorieAjoutee {
  id: string;
  nom: string;
  compte: string;
}

let ajoutees: CategorieAjoutee[] = [];

/** Mémorise les listes ajoutées à l'inventaire (relues depuis le stockage à chaque ouverture d'une nouvelle écriture). */
export const definirCategoriesAjoutees = (categories: CategorieAjoutee[]): void => {
  ajoutees = categories;
};

/** Les catégories de recette ajoutées par l'utilisateur dans la structure de l'inventaire. */
export const categoriesAjoutees = (): CategorieAjoutee[] => ajoutees;
