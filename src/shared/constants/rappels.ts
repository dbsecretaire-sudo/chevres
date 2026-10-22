/** Valeurs des rappels de déclarations (RSA agricole, URSSAF) — à modifier ici uniquement. */

/** Les rappels de déclaration : le RSA agricole se déclare chaque trimestre, l'URSSAF (gîte, secrétariat) chaque mois. */
export const GENRE_RAPPEL = {
  RSA: 'rsa',
  URSSAF: 'urssaf',
  /** L'échéance d'un contenu d'un groupement (GDS, achat groupé…) : elle se valide en passant le contenu à « terminé ». */
  GROUPEMENT: 'groupement',
  /** L'envoi à la chambre d'agriculture du document de circulation d'une vente, d'un achat ou d'un envoi à l'abattoir : il se valide une fois envoyé. */
  CIRCULATION: 'circulation',
  /** L'échantillon d'un plat préparé à envoyer à un laboratoire d'analyses : il se valide une fois envoyé. */
  ANALYSE_PLAT: 'analyse_plat',
  /** Une étape obligatoire du dossier réglementaire d'un savon qui manque : elle se valide en la faisant, dans le dossier du savon. */
  DOSSIER_SAVON: 'dossier_savon',
  /** Le stock à préparer pour une visite de la ferme ou une commande qui approche : il se valide une fois la préparation faite. */
  STOCK_A_PREVOIR: 'stock_a_prevoir',
  /** Une démarche obligatoire pour accueillir du public qui n'est pas faite : elle se valide en la faisant, dans Agritourisme › Accueil du public. */
  ACCUEIL_PUBLIC: 'accueil_public',
} as const;

/** Le stock d'une visite ou d'une commande est rappelé à partir de ce nombre de jours avant elle. */
export const JOURS_STOCK_A_PREVOIR = 7;

/** Une analyse de plats est rappelée sur l'accueil à partir de ce nombre de jours avant son échéance. */
export const JOURS_AVANT_ANALYSE = 7;

/** Une échéance de groupement non terminée est rappelée sur l'accueil à partir de ce nombre de jours avant (ou si elle est passée). */
export const JOURS_ECHEANCE_GROUPEMENT = 30;

/** Combien de périodes terminées on rappelle au plus (la dernière, et celle d'avant si elle n'a pas été validée). */
export const PERIODES_RAPPELEES = 2;

/** Mois d'un trimestre. */
export const MOIS_PAR_TRIMESTRE = 3;
