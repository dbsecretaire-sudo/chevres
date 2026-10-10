/** Valeurs des contrôles de l'exploitation (surface, animaux, lait) — à modifier ici uniquement. */

/** Les familles de contrôles : les volets de l'écran Contrôles, et leurs onglets. */
export const FAMILLE_CONTROLE = {
  /** Les contrôles de surface (déclaration PAC, contrôle sur place…). */
  SURFACE: 'surface',
  /** Les contrôles des animaux (ASP : identification, registre…). */
  ANIMAUX: 'animaux',
  /** Le contrôle laitier. */
  LAITIER: 'laitier',
  /** Les boucles d'identification de l'inventaire (celles à poser, les posées), dans le contrôle des animaux. */
  BOUCLES: 'boucles',
  /** Les terrains (parcelles) suivis dans le volet des contrôles de surface. */
  TERRAIN: 'terrain',
  /** Les analyses du lait, dans le volet du contrôle laitier. */
  ANALYSE: 'analyse',
  /** Le résumé des terrains : leurs vues satellites groupées et les surfaces de l'exploitation. */
  RESUME: 'resume',
  /** Les groupements (adhésion, achats groupés, actions spécifiques : GDS, Casgiu Casanu…). */
  GROUPEMENT: 'groupement',
} as const;

/** Les volets proposés dans l'écran Contrôles, dans l'ordre. */
export const VOLETS_CONTROLE = [
  FAMILLE_CONTROLE.SURFACE,
  FAMILLE_CONTROLE.ANIMAUX,
  FAMILLE_CONTROLE.LAITIER,
  FAMILLE_CONTROLE.GROUPEMENT,
] as const;

/** La nature d'un groupement, choisie à la saisie (stockée comme résultat). */
export const NATURE_GROUPEMENT = ['adhesion', 'achat_groupe', 'action_specifique'] as const;

/** Les onglets de chaque volet : ses contrôles, puis ce qu'il a de plus (terrains et résumé, boucles, analyses). */
export const ONGLETS_VOLET = {
  [FAMILLE_CONTROLE.SURFACE]: [FAMILLE_CONTROLE.SURFACE, FAMILLE_CONTROLE.TERRAIN, FAMILLE_CONTROLE.RESUME],
  [FAMILLE_CONTROLE.ANIMAUX]: [FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES],
  [FAMILLE_CONTROLE.LAITIER]: [FAMILLE_CONTROLE.LAITIER, FAMILLE_CONTROLE.ANALYSE],
  [FAMILLE_CONTROLE.GROUPEMENT]: [FAMILLE_CONTROLE.GROUPEMENT],
} as const;

/** Les quatre surfaces d'un terrain (en hectares), comme sur TelePAC : le nom du champ de chaque surface. */
export const SURFACE_TERRAIN = {
  GRAPHIQUE: 'surfaceGraphique',
  ADMISSIBLE: 'surfaceAdmissible',
  FOURRAGERE: 'surfaceFourragere',
  IRRIGUEE: 'surfaceIrriguee',
} as const;

/** Les surfaces d'un terrain, dans l'ordre où elles s'affichent. */
export const SURFACES_TERRAIN = [
  SURFACE_TERRAIN.GRAPHIQUE,
  SURFACE_TERRAIN.ADMISSIBLE,
  SURFACE_TERRAIN.FOURRAGERE,
  SURFACE_TERRAIN.IRRIGUEE,
] as const;

/** Un grade de qualité du lait (A, B ou C). */
export const GRADES_LAIT = ['A', 'B', 'C'] as const;

/** Le résultat de la recherche d'antibiotiques : négatif ou positif. */
export const RESULTAT_ANTIBIOTIQUE = ['negatif', 'positif'] as const;

/**
 * Les paramètres d'une analyse de lait, dans l'ordre du rapport. `format` dit comment un résultat s'écrit : « groupe » pour les
 * grands nombres (des espaces tous les 3 chiffres : 1 500 000), « decimal » pour les résultats à virgule (jusqu'à 6 chiffres après
 * la virgule). `grade` : le paramètre a aussi un grade (A, B ou C). `signe` : le résultat peut être négatif (cryoscopie).
 */
export const PARAMETRES_LAIT = [
  { cle: 'matiereGrasse', format: 'decimal', moyenne: 'ponderee' },
  { cle: 'matiereProteique', format: 'decimal', moyenne: 'ponderee' },
  { cle: 'antibiotique', format: 'choix' },
  { cle: 'floreTotale', format: 'groupe', grade: true, moyenne: 'arithmetique' },
  { cle: 'cellules', format: 'groupe' },
  { cle: 'butyriques', format: 'groupe' },
  { cle: 'cryoscopie', format: 'decimal', grade: true, signe: true },
  { cle: 'lipolyse', format: 'decimal' },
  { cle: 'staphylocoques', format: 'groupe' },
  { cle: 'coliformes', format: 'groupe', grade: true, moyenne: 'arithmetique' },
  { cle: 'ecoli', format: 'groupe' },
  { cle: 'pseudomonas', format: 'groupe' },
  { cle: 'uree', format: 'decimal', moyenne: 'arithmetique' },
  { cle: 'igg', format: 'decimal' },
] as const;

export type CleParametreLait = (typeof PARAMETRES_LAIT)[number]['cle'];

/** Le nombre de chiffres après la virgule qu'un résultat décimal garde (cryoscopie : -0,519 → -0,519). */
export const DECIMALES_MAX_LAIT = 6;
