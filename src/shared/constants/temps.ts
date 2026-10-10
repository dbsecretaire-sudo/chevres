/** Constantes de calendrier et de durée — à modifier ici uniquement. */

export const JOURS_PAR_AN = 365;
export const MOIS_PAR_AN = 12;

/** Suffixes ajoutés à une date ISO (AAAA-MM-JJ) pour obtenir un instant local sans décalage de fuseau. */
export const HEURE_MINUIT = 'T00:00:00';
export const HEURE_MIDI = 'T12:00:00';

/** Dernier jour de l'année civile, au format MM-JJ (à préfixer par l'année). */
export const FIN_ANNEE_MOIS_JOUR = '12-31';

export const JOURS_PAR_SEMAINE = 7;

/** Millisecondes dans une journée (pour compter des jours entre deux dates locales). */
export const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Unités dans lesquelles on exprime un âge (le porcelet se compte en jours, le poussin en semaines, le veau en mois). */
export const UNITE_DUREE = {
  JOURS: 'jours',
  SEMAINES: 'semaines',
  MOIS: 'mois',
} as const;

/** Le temps (ms) sans nouvelle saisie après lequel une modification s'enregistre toute seule. */
export const DELAI_ENREGISTREMENT_AUTO = 800;
