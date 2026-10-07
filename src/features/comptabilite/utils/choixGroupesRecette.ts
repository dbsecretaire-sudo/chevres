/** Le début de l'identifiant d'une catégorie de recette ajoutée par l'utilisateur (le reste est son identifiant). */
export const PREFIXE_CATEGORIE_AJOUTEE = 'perso:';

/** Une catégorie de recette ajoutée par l'utilisateur : son nom et le compte du plan comptable où ses ventes s'inscrivent. */
export interface CategorieAjoutee {
  id: string;
  nom: string;
  compte: string;
}

/**
 * Les catégories de recette cochées pour chaque espèce : des catégories d'office (leur groupe) et des catégories ajoutées
 * (leur identifiant précédé de `perso:`). Une espèce absente garde ses catégories d'office.
 */
export type ChoixGroupesRecette = Partial<Record<string, string[]>>;

let choix: ChoixGroupesRecette = {};
let ajoutees: CategorieAjoutee[] = [];

/** Mémorise le choix de l'établissement actif (relu depuis le stockage à chaque changement d'établissement). */
export const definirChoixGroupesRecette = (
  nouveau: ChoixGroupesRecette,
  categories: CategorieAjoutee[] = [],
): void => {
  choix = nouveau;
  ajoutees = categories;
};

export const choixGroupesRecette = (): ChoixGroupesRecette => choix;

/** Les catégories ajoutées cochées pour une espèce. */
export const categoriesAjouteesEspece = (espece: string): CategorieAjoutee[] => {
  const coches = choix[espece] ?? [];
  return ajoutees.filter((c) => coches.includes(`${PREFIXE_CATEGORIE_AJOUTEE}${c.id}`));
};
