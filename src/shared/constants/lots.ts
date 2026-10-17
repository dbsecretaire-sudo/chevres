/** Les catégories de lots d'animaux proposées d'office (celles que l'utilisateur ajoute ont leur nom pour identifiant). */
export const CATEGORIE_LOT = {
  ABATTOIR: 'abattoir',
  VETERINAIRE: 'veterinaire',
  /** Les femelles mises à la reproduction à une date : le carnet de mise bas les compte pour les mises bas qui suivent. */
  REPRODUCTION: 'reproduction',
  /** Les animaux désignés pour le renouvellement d'une année : un lot par année, créé tout seul, où l'on ajoute et retire des animaux. */
  RENOUVELLEMENT: 'renouvellement',
  /** Les femelles qui ont avorté une année : un lot par année, créé tout seul. */
  AVORTEMENT: 'avortement',
} as const;
