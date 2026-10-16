/** Valeurs des contrôles de l'exploitation (surface, animaux, lait) — à modifier ici uniquement. */

import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Les familles de contrôles : les volets de l'écran Contrôles, et leurs onglets. */
export const FAMILLE_CONTROLE = {
  /** Les contrôles de surface (déclaration PAC, contrôle sur place…). */
  SURFACE: 'surface',
  /** Les contrôles des animaux (ASP : identification, registre…). */
  ANIMAUX: 'animaux',
  /** Le contrôle laitier. */
  LAITIER: 'laitier',
  /** Les boucles d'identification de l'inventaire (boucles, boucles rouges, tiptag : trois listes l'une sous l'autre), dans le contrôle des animaux. */
  BOUCLES: 'boucles',
  /** Les terrains (parcelles) suivis dans le volet des contrôles de surface. */
  TERRAIN: 'terrain',
  /** Les analyses du lait, dans le volet du contrôle laitier. */
  ANALYSE: 'analyse',
  /** Le résumé des terrains : leurs vues satellites groupées et les surfaces de l'exploitation. */
  RESUME: 'resume',
  /** Les groupements (adhésion, achats groupés, actions spécifiques : GDS, Casgiu Casanu…). */
  GROUPEMENT: 'groupement',
  /** Les contrôles officiels des services de l'État, à l'abattoir (cochons, vaches). */
  OFFICIEL: 'officiel',
  /** Les autocontrôles de l'éleveur (cochons, vaches) : ses propres analyses et vérifications. */
  AUTOCONTROLE: 'autocontrole',
  /** Le dépistage de la salmonelle dans les fientes (poules). */
  SALMONELLE: 'salmonelle',
} as const;

/**
 * Ce qu'un nouvel élément du volet Terrains peut être : une parcelle (le formulaire des surfaces), ou un document de l'exploitation
 * (assurance récolte PAC, registre parcellaire, récapitulatif des assolements) qu'on joint en image avec sa date.
 */
export const TYPE_DOCUMENT_TERRAIN = {
  PARCELLE: 'parcelle',
  ASSURANCE_RECOLTE: 'assurance_recolte',
  REGISTRE_PARCELLAIRE: 'registre_parcellaire',
  RECAPITULATIF_ASSOLEMENTS: 'recapitulatif_assolements',
} as const;

/** La nature d'un contenu de groupement (la note ou la démarche qu'il range). */
/** La nature « Courrier / courriel » : une lettre ou un message à écrire au partenaire (la mise en forme se fait toute seule). */
export const NATURE_COURRIEL = 'courrier_courriel';

/** La nature « Aide » d'un contenu d'organisme : le dossier d'une aide (ses pièces jointes) et ses paiements, des recettes de la comptabilité. */
export const NATURE_AIDE = 'aide';

export const NATURE_CONTENU_GROUPEMENT = ['achat_groupe', 'action_specifique', NATURE_COURRIEL] as const;

/** La nature d'un contenu d'équarrisseur : des contrats, des factures, des promotions (pas d'achat groupé). */
export const NATURE_CONTENU_EQUARRISSAGE = ['contrat', 'facture', 'promotion', NATURE_COURRIEL] as const;

/** La nature d'un contenu d'organisme (MSA, DDTM, DRAAF, ODARC…) : des courriers, des démarches, des documents. */
export const NATURE_CONTENU_ORGANISME = [NATURE_COURRIEL, NATURE_AIDE, 'demarche', 'document'] as const;

/** L'envoi en recommandé d'un courrier : simple, ou avec accusé de réception (jamais les deux). */
export const RECOMMANDE = { SIMPLE: 'simple', AR: 'ar' } as const;
export type Recommande = (typeof RECOMMANDE)[keyof typeof RECOMMANDE];

/** La nature d'un contenu d'assureur : des contrats, des courriers, des démarches (sinistre…), des documents. */
export const NATURE_CONTENU_ASSUREUR = ['contrat', NATURE_COURRIEL, 'demarche', 'document'] as const;

/** La hauteur du graphique du résumé du contrôle laitier quand il s'affiche en plein écran (px). */
export const HAUTEUR_COURBE_PLEIN_ECRAN = 340;

/** Les niveaux de vigilance d'un résultat d'analyse. */
export const NIVEAU_VIGILANCE = {
  VIGILANCE: 'vigilance',
  CRITIQUE: 'critique',
} as const;

/** Le niveau de chaque grade du rapport : A est excellent (aucun niveau), B demande de la vigilance (orange), C est critique (rouge). */
export const VIGILANCE_PAR_GRADE: Record<string, ValeurDe<typeof NIVEAU_VIGILANCE> | undefined> = {
  B: NIVEAU_VIGILANCE.VIGILANCE,
  C: NIVEAU_VIGILANCE.CRITIQUE,
};

/**
 * Les seuils qui font signaler un résultat chiffré du lait comme point de vigilance (en plus des grades B et C des rapports),
 * chacun avec les mêmes unités que la saisie. Hors de [vigilanceMin, vigilanceMax], le point demande de la vigilance (orange) ; hors de
 * [critiqueMin, critiqueMax], il est critique (rouge). Les paramètres absents n'ont pas de seuil.
 * - Flore totale : 500 000 germes/ml pour un lait destiné à des produits au lait cru sans traitement thermique, 1 500 000 sinon
 *   (règlement CE 853/2004, annexe III, section IX, pour les espèces autres que la vache). Le règlement juge une moyenne
 *   géométrique glissante sur deux mois ; ici, chaque analyse est comparée aux seuils.
 * - Cryoscopie : un point de congélation au-dessus de −0,520 °C fait craindre de l'eau dans le lait (repère de réponses
 *   consultées, non vérifié dans une norme).
 * - Urée : de 150 à 300 mg/l (repère de conseil en élevage, non vérifié dans un document officiel).
 */
export const SEUILS_VIGILANCE_LAIT: Partial<
  Record<
    'floreTotale' | 'cryoscopie' | 'uree',
    { vigilanceMin?: number; vigilanceMax?: number; critiqueMin?: number; critiqueMax?: number }
  >
> = {
  floreTotale: { vigilanceMax: 500000, critiqueMax: 1500000 },
  cryoscopie: { critiqueMax: -0.52 },
  uree: { vigilanceMin: 150, vigilanceMax: 300 },
};

/**
 * Les actions conseillées après des points de vigilance ou critiques, dans l'ordre où les mener, chacune avec les paramètres dont
 * elle peut corriger les points. Une action n'apparaît au rapport que si un de ses paramètres est signalé. S'y ajoute toujours, en
 * dernier, une nouvelle analyse pour confirmer l'amélioration.
 */
export const ACTIONS_LAIT = [
  { cle: 'hygiene', parametres: ['floreTotale', 'coliformes'] },
  { cle: 'installation', parametres: ['floreTotale', 'cryoscopie'] },
  { cle: 'ration', parametres: ['uree', 'cryoscopie'] },
] as const;

/** Le résultat « antibiotique » d'une analyse qui est positif : toujours critique. */
export const ANTIBIOTIQUE_POSITIF = 'positif';

/** L'onglet « Santé » du volet des animaux : les visites vétérinaires (ce n'est pas une famille de contrôles). */
export const ONGLET_SANTE = 'sante';

/** Les onglets de chaque volet : ses contrôles, puis ce qu'il a de plus (terrains et résumé, boucles, analyses). */
export const ONGLETS_VOLET = {
  [FAMILLE_CONTROLE.SURFACE]: [FAMILLE_CONTROLE.TERRAIN, FAMILLE_CONTROLE.RESUME, FAMILLE_CONTROLE.SURFACE],
  [FAMILLE_CONTROLE.ANIMAUX]: [ONGLET_SANTE, FAMILLE_CONTROLE.BOUCLES, FAMILLE_CONTROLE.ANIMAUX],
  [FAMILLE_CONTROLE.LAITIER]: [FAMILLE_CONTROLE.ANALYSE, FAMILLE_CONTROLE.RESUME, FAMILLE_CONTROLE.LAITIER],
  [FAMILLE_CONTROLE.GROUPEMENT]: [FAMILLE_CONTROLE.GROUPEMENT],
  [FAMILLE_CONTROLE.OFFICIEL]: [FAMILLE_CONTROLE.OFFICIEL, FAMILLE_CONTROLE.AUTOCONTROLE],
  [FAMILLE_CONTROLE.SALMONELLE]: [FAMILLE_CONTROLE.SALMONELLE],
} as const;

/**
 * Le volet d'analyses que suit chaque espèce, en plus de ce que la Production lui propose déjà : les cochons et les vaches ont les
 * contrôles officiels (abattoir) et leurs autocontrôles, les poules le dépistage de la salmonelle dans les fientes. Les chèvres et les
 * brebis ont les analyses du lait (le volet du contrôle laitier) ; les animaux de compagnie n'en ont pas.
 */
export const VOLET_ANALYSES_PAR_ESPECE: Record<
  string,
  typeof FAMILLE_CONTROLE.OFFICIEL | typeof FAMILLE_CONTROLE.SALMONELLE
> = {
  cochons: FAMILLE_CONTROLE.OFFICIEL,
  vaches: FAMILLE_CONTROLE.OFFICIEL,
  poules: FAMILLE_CONTROLE.SALMONELLE,
};

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

/**
 * Les codes de culture d'une parcelle (déclaration PAC) : prairie de 6 ans et plus, prairie avec herbe prédominante, surface pastorale,
 * châtaigneraie et chênaie entretenues par des porcins ou des petits ruminants.
 */
export const CODES_CULTURE = ['PPH', 'SPH', 'SPL', 'CAE', 'CEE'] as const;

/** Les listes de valeurs que l'utilisateur modifie (le crayon d'une liste déroulante) : la clé de chacune dans les réglages. */
export const CLE_LISTE_PERSONNALISEE = {
  MOTIFS_VISITE: 'motifsVisite',
  CODES_CULTURE: 'codesCulture',
  TAUX_IMPOSITION: 'tauxImposition',
} as const;

/**
 * La zone ICHN d'une parcelle (note de cadrage de l'ODARC, Corse) : la haute montagne sèche et la montagne sèche (intervention 71.04), les
 * zones soumises à des contraintes naturelles (71.05, ZSCN) ou spécifiques (71.06, ZSCS). Une parcelle sans zone est en montagne sèche.
 */
export const ZONE_ICHN = {
  HAUTE_MONTAGNE_SECHE: 'haute_montagne_seche',
  MONTAGNE_SECHE: 'montagne_seche',
  ZSCN: 'zscn',
  ZSCS: 'zscs',
} as const;

/** La zone d'une parcelle qui n'en a pas. */
export const ZONE_ICHN_PAR_DEFAUT = ZONE_ICHN.MONTAGNE_SECHE;

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
