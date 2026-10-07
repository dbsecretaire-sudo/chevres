/** Valeurs des activités annexes du gîte — à modifier ici uniquement. */

/** Les icônes proposées pour une activité annexe (noms d'icônes Ionicons), la première d'office. */
export const ICONES_ANNEXE = [
  'storefront',
  'pizza',
  'cafe',
  'restaurant',
  'ice-cream',
  'wine',
  'basket',
  'cart',
  'gift',
  'map',
  'compass',
  'bicycle',
  'walk',
  'camera',
  'leaf',
  'flower',
  'paw',
  'star',
] as const;

/** Le nombre maximum d'un même article sur un ticket (la quantité se choisit de 1 à ce nombre). */
export const NOMBRE_MAX_ARTICLES_TICKET = 50;

/** Les comptes de recette (classe 7) du plan comptable, où une activité annexe inscrit ses ventes. */
export const PREFIXE_COMPTES_RECETTE_ANNEXE = '7';

/** L'étiquette du stock du gîte qui ouvre le bloc des activités annexes (paramètre « onglet » du lien vers l'inventaire). */
export const SECTION_ANNEXES = 'annexes';

/** Le début de la valeur du filtre d'activité du stock d'un gîte quand c'est une activité annexe (le reste est son identifiant). */
export const PREFIXE_FILTRE_ANNEXE = 'annexe:';

/**
 * Les activités annexes créée d'office : le bar et le restaurant ensemble, avec le compte de leur recette (celui du plan comptable) et
 * leur TVA. Elles se modifient et se suppriment comme celles que l'on ajoute.
 */
export const ACTIVITES_ANNEXES_PAR_DEFAUT = [
  {
    id: 'restaurant',
    cleNom: 'barRestaurant',
    icone: 'restaurant',
    categorieRecette: 'restauration',
    tauxTva: 20,
    repasGite: true,
  },
] as const;

/** L'identifiant de l'ancienne activité « Bar » : elle a été fusionnée avec le restaurant (ses articles et ses tickets y sont passés). */
export const ID_ACTIVITE_BAR_FUSIONNEE = 'bar';
