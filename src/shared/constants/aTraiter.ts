/** Valeurs de l'écran « À traiter » (ce qui attend l'utilisateur dans tous ses établissements) — à modifier ici uniquement. */

/** Les sortes de choses à traiter, dans l'ordre où elles s'affichent. */
export const GENRE_A_TRAITER = {
  TACHE_EN_RETARD: 'tache_en_retard',
  TACHE_PROCHE: 'tache_proche',
  SEJOUR_A_ENCAISSER: 'sejour_a_encaisser',
  NOTE_A_FACTURER: 'note_a_facturer',
} as const;

/** Une tâche non terminée dont l'échéance tombe dans ce nombre de jours (ou moins) est à traiter bientôt. */
export const JOURS_TACHE_PROCHE = 7;

/** Un séjour non encaissé est à traiter dès que son arrivée tombe dans ce nombre de jours (ou qu'il a déjà commencé). */
export const JOURS_SEJOUR_A_ENCAISSER = 7;

/** Le nombre de lignes montrées par établissement avant « voir plus ». */
export const LIGNES_A_TRAITER_VISIBLES = 4;
