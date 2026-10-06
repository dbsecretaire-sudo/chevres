/** Valeurs du gîte d'étape (chambres, calendrier) — à modifier ici uniquement. */

/** Chaque chambre a quatre lits (deux lits superposés de chaque côté). */
export const LITS_PAR_CHAMBRE = 4;

/** Le côté du couloir où se trouve une chambre. */
export const COTE_CHAMBRE = {
  GAUCHE: 'gauche',
  DROITE: 'droite',
} as const;

/** Les chambres d'un gîte qui n'a encore rien configuré : six, les trois premières à gauche du couloir, les trois autres à droite. */
export const CHAMBRES_PAR_DEFAUT: {
  numero: number;
  cote: (typeof COTE_CHAMBRE)[keyof typeof COTE_CHAMBRE];
}[] = [
  { numero: 1, cote: COTE_CHAMBRE.GAUCHE },
  { numero: 2, cote: COTE_CHAMBRE.GAUCHE },
  { numero: 3, cote: COTE_CHAMBRE.GAUCHE },
  { numero: 4, cote: COTE_CHAMBRE.DROITE },
  { numero: 5, cote: COTE_CHAMBRE.DROITE },
  { numero: 6, cote: COTE_CHAMBRE.DROITE },
];

/** Ce qui s'ajoute à un séjour déjà payé : un remboursement du client, ou une prestation supplémentaire. */
export const TYPE_AJUSTEMENT_SEJOUR = {
  REMBOURSEMENT: 'remboursement',
  PRESTATION: 'prestation',
} as const;

/** Quand une réservation prend ses repas : à midi, le soir, ou aux deux. */
export const SERVICE_REPAS = {
  MIDI: 'midi',
  SOIR: 'soir',
  MIDI_SOIR: 'midi_soir',
} as const;

/** Le service proposé d'abord à la création d'une réservation (et celui des anciennes réservations). */
export const SERVICE_REPAS_PAR_DEFAUT = SERVICE_REPAS.SOIR;

/** Nombre de repas par personne et par nuit selon le service. */
export const REPAS_PAR_NUIT = {
  [SERVICE_REPAS.MIDI]: 1,
  [SERVICE_REPAS.SOIR]: 1,
  [SERVICE_REPAS.MIDI_SOIR]: 2,
} as const;

/** Nombre de jours d'une semaine (colonnes du calendrier, qui commence le lundi). */
export const JOURS_PAR_SEMAINE_CALENDRIER = 7;
