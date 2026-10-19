/** Valeurs des rappels de déclarations (RSA agricole, URSSAF) — à modifier ici uniquement. */

/** Les rappels de déclaration : le RSA agricole se déclare chaque trimestre, l'URSSAF (gîte, secrétariat) chaque mois. */
export const GENRE_RAPPEL = {
  RSA: 'rsa',
  URSSAF: 'urssaf',
  /** L'échéance d'un contenu d'un groupement (GDS, achat groupé…) : elle se valide en passant le contenu à « terminé ». */
  GROUPEMENT: 'groupement',
  /** L'envoi à la chambre d'agriculture du document de circulation d'une vente, d'un achat ou d'un envoi à l'abattoir : il se valide une fois envoyé. */
  CIRCULATION: 'circulation',
} as const;

/** Le rappel d'envoi d'un document de circulation couvre les écritures des derniers jours (au-delà, on ne réclame plus : l'historique ne se remplit pas d'anciennes écritures). */
export const JOURS_RAPPEL_ENVOI_CIRCULATION = 90;

/** Une échéance de groupement non terminée est rappelée sur l'accueil à partir de ce nombre de jours avant (ou si elle est passée). */
export const JOURS_ECHEANCE_GROUPEMENT = 30;

/** Combien de périodes terminées on rappelle au plus (la dernière, et celle d'avant si elle n'a pas été validée). */
export const PERIODES_RAPPELEES = 2;

/** Mois d'un trimestre. */
export const MOIS_PAR_TRIMESTRE = 3;
