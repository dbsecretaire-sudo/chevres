/** Valeurs du journal de trading (activité financière) — à modifier ici uniquement. */

/** Sens d'une position : achat (long) ou vente à découvert (short). */
export const SENS_TRADE = {
  ACHAT: 'achat',
  VENTE: 'vente',
} as const;

export const TYPE_INSTRUMENT = {
  ACTION: 'action',
  ETF: 'etf',
  FOREX: 'forex',
  CRYPTO: 'crypto',
  FUTURES: 'futures',
  OPTION: 'option',
  CFD: 'cfd',
  AUTRE: 'autre',
} as const;

/** L'état d'esprit noté au moment du trade : il aide à repérer ce qui coûte le plus. */
export const ETAT_ESPRIT = {
  CALME: 'calme',
  CONFIANT: 'confiant',
  HESITANT: 'hesitant',
  STRESSE: 'stresse',
  IMPULSIF: 'impulsif',
  PEUR_DE_RATER: 'peur_de_rater',
  REVANCHE: 'revanche',
} as const;

/** Les deux sens d'un mouvement du compte de trading : dépôt (+) ou retrait (−). */
export const SENS_MOUVEMENT = {
  DEPOT: 'depot',
  RETRAIT: 'retrait',
} as const;

/** Réponses possibles à « plan respecté ? » (vide : non renseigné). */
export const PLAN_RESPECTE = {
  OUI: 'oui',
  NON: 'non',
} as const;

export const FILTRE_TRADES = {
  TOUS: 'tous',
  OUVERTS: 'ouverts',
  GAGNANTS: 'gagnants',
  PERDANTS: 'perdants',
  HORS_PLAN: 'hors_plan',
} as const;

/** Les angles d'analyse de la répartition des résultats. */
export const ANGLE_ANALYSE = {
  STRATEGIE: 'strategie',
  INSTRUMENT: 'instrument',
  ETAT_ESPRIT: 'etat_esprit',
  JOUR: 'jour',
} as const;

/** Nombre de trades clos en dessous duquel on ne tire aucune observation (trop peu pour conclure). */
export const MIN_TRADES_OBSERVATIONS = 5;

/** Nombre de trades clos d'un groupe (stratégie, jour…) en dessous duquel il n'est pas comparé. */
export const MIN_TRADES_GROUPE = 3;

/** Nombre de pertes d'affilée, jusqu'au dernier trade, à partir duquel on le signale. */
export const SERIE_PERTES_SIGNALEE = 3;

/** Part (en %) de trades sans stop à partir de laquelle on le signale. */
export const SEUIL_TRADES_SANS_STOP = 50;

/** Nombre de trades récents montrés sur l'accueil. */
export const NOMBRE_TRADES_ACCUEIL = 5;

/** Nombre maximal d'observations affichées en même temps. */
export const MAX_OBSERVATIONS = 6;

/** Nombre de décimales d'un prix saisi (l'affichage suit le prix tel qu'il a été entré). */
export const DECIMALES_MULTIPLE_R = 2;
