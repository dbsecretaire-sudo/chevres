/** Le lait — à modifier ici uniquement. */

/** Le nombre de traites par jour : toute la période de traite se passe en deux traites. */
export const TRAITES_PAR_JOUR = 2;

/**
 * Le mois où la traite démarre ne compte pas dans les jours de la période de production : le lait n'y est produit que sur une partie du
 * mois (le premier mois de ventes est bien plus petit que les suivants), alors que le calcul prend le mois en entier.
 */
export const MOIS_DE_DEMARRAGE_NON_COMPTES = 1;

/** La clé de la ligne du brocciu dans l'inventaire : il se fabrique avec le petit-lait des autres fromages. */
export const CLE_FROMAGE_BROCCIU = 'fromage:brocciu';

/**
 * La recette du brocciu, d'après l'éleveuse : 20 L de petit-lait (issus de 40 L de lait caillé), 25 % de lait entier ajouté (du volume
 * de petit-lait) et 5 g de sel par litre de petit-lait. Le cahier des charges de l'AOP Brocciu ne chiffre pas ces proportions (lactosérum de
 * chèvre ou de brebis, lait entier cru et sel, sans plus de détail) : elles sont celles de la recette de la maison.
 */
export const RECETTE_BROCCIU = {
  litresPetitLaitParLot: 20,
  litresLaitCailleParLot: 40,
  partLaitEntier: 0.25,
  selGParLitrePetitLait: 5,
} as const;

/** Les seuls fromages dont le petit-lait sert au brocciu : le fromage frais et l'affiné (pas le crottin, ni un fromage ajouté). */
export const FROMAGES_POUR_PETIT_LAIT: readonly string[] = ['fromage:frais', 'fromage:affine'];

/** La durée d'amortissement proposée pour la fromagerie (années) tant que l'utilisateur n'en donne pas : à fixer avec le comptable. */
export const DUREE_AMORTISSEMENT_DEFAUT = 10;
