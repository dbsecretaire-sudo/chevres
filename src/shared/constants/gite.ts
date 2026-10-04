/** Valeurs du gîte d'étape (chambres, calendrier) — à modifier ici uniquement. */

/** Le gîte compte six chambres, trois de chaque côté du couloir. */
export const NOMBRE_CHAMBRES_GITE = 6;

/** Chaque chambre a quatre lits (deux lits superposés de chaque côté). */
export const LITS_PAR_CHAMBRE = 4;

/** Nombre de chambres de chaque côté du couloir. */
export const CHAMBRES_PAR_COTE = NOMBRE_CHAMBRES_GITE / 2;

/** Les numéros des chambres : 1 à 6 (les trois premières à gauche du couloir, les trois autres à droite). */
export const NUMEROS_CHAMBRES: readonly number[] = Array.from(
  { length: NOMBRE_CHAMBRES_GITE },
  (_, i) => i + 1,
);

/** Nombre de jours d'une semaine (colonnes du calendrier, qui commence le lundi). */
export const JOURS_PAR_SEMAINE_CALENDRIER = 7;
