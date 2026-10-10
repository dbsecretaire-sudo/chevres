/** Valeurs des rappels de déclarations (RSA agricole, URSSAF) — à modifier ici uniquement. */

/** Les rappels de déclaration : le RSA agricole se déclare chaque trimestre, l'URSSAF (gîte, secrétariat) chaque mois. */
export const GENRE_RAPPEL = {
  RSA: 'rsa',
  URSSAF: 'urssaf',
  /** L'échéance d'un contenu d'un groupement (GDS, achat groupé…) : elle se valide en passant le contenu à « terminé ». */
  GROUPEMENT: 'groupement',
} as const;

/** Une échéance de groupement non terminée est rappelée sur l'accueil à partir de ce nombre de jours avant (ou si elle est passée). */
export const JOURS_ECHEANCE_GROUPEMENT = 30;

/** Combien de périodes terminées on rappelle au plus (la dernière, et celle d'avant si elle n'a pas été validée). */
export const PERIODES_RAPPELEES = 2;

/** Mois d'un trimestre. */
export const MOIS_PAR_TRIMESTRE = 3;
