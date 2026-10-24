/** Valeurs de l'écran « À traiter » (ce qui attend l'utilisateur dans tous ses établissements) — à modifier ici uniquement. */

/** Les sortes de choses à traiter, dans l'ordre où elles s'affichent. */
export const GENRE_A_TRAITER = {
  /** Une déclaration (RSA) à valider. */
  RAPPEL_FISCAL: 'rappel_fiscal',
  /** Des lots vendus dont le contrôle n'est pas ok : à rappeler. */
  LOTS_A_RAPPELER: 'lots_a_rappeler',
  /** Le rappel d'un lot déjà lancé, à valider quand il est fait. */
  RAPPEL_LOT_A_VALIDER: 'rappel_lot_a_valider',
} as const;
