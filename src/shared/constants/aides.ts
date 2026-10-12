import type { ImageSourcePropType } from 'react-native';

/** Les sites où se publient les montants des aides (les liens des fenêtres d'explication). */
export const LIEN_AIDE = {
  LEGIFRANCE: 'legifrance',
  AGRICULTURE: 'agriculture',
  /** La page de l'ODARC sur les interventions ICHN (71.04, 71.05, 71.06) du plan stratégique national : note de cadrage et décisions. */
  ODARC_ICHN: 'odarcIchn',
  /** La page du ministère sur le classement des communes en zone défavorisée (le fichier des communes classées). */
  ZONE_DEFAVORISEE: 'zoneDefavorisee',
  /** Le texte (Légifrance) qui fixe le pourcentage de la réduction pour plafonnement budgétaire du paiement de base. */
  PLAFONNEMENT_BUDGETAIRE: 'plafonnementBudgetaire',
} as const;

export const URL_LIEN_AIDE: Record<(typeof LIEN_AIDE)[keyof typeof LIEN_AIDE], string> = {
  [LIEN_AIDE.LEGIFRANCE]: 'https://www.legifrance.gouv.fr/',
  [LIEN_AIDE.AGRICULTURE]: 'https://agriculture.gouv.fr/',
  [LIEN_AIDE.ZONE_DEFAVORISEE]:
    'https://agriculture.gouv.fr/aides-aux-exploitations-classement-en-zone-defavorisee',
  [LIEN_AIDE.PLAFONNEMENT_BUDGETAIRE]:
    'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000052328766/2026-10-12',
  [LIEN_AIDE.ODARC_ICHN]: 'https://www.odarc.corsica/Interventions-ICHN-71-04-71-05-71-06-du-PSN_a351.html',
};

/** Les images montrées dans les fenêtres d'explication des aides : l'image, et son rapport largeur / hauteur. */
export const IMAGE_AIDE = {
  /** L'annexe d'un relevé de situation des aides directes de la PAC : les tableaux où se lisent les montants unitaires. */
  RELEVE_ANNEXE: 'releveAnnexe',
  /** La première page d'un relevé de situation (les identifiants et le numéro de compte y sont masqués). */
  RELEVE_PAGE1: 'relevePage1',
  /** Le tableau de l'aide aux petits ruminants d'un relevé de situation (relevé du 14/01/2026). */
  RELEVE_APR: 'releveApr',
  /** Le zonage de l'ICHN en Corse et les montants par hectare de chaque zone (note de cadrage de l'ODARC). */
  ICHN_ZONES: 'ichnZones',
  /** Un extrait du fichier de classement des communes : la zone de chaque commune (montagne, zone défavorisée simple, handicap spécifique). */
  CLASSEMENT_COMMUNES: 'classementCommunes',
  /** L'onglet « DPB » de Télépac (portefeuille DPB) : la valeur unitaire des DPB de la campagne (le numéro Pacage et les générateurs y sont masqués). */
  DPB_TELEPAC: 'dpbTelepac',
  /** La lettre de la DDT sur le portefeuille de DPB : le coefficient de réduction, le stabilisateur et la valeur unitaire après coefficient. */
  LETTRE_DDT: 'lettreDdt',
} as const;

export const IMAGES_AIDES: Record<
  (typeof IMAGE_AIDE)[keyof typeof IMAGE_AIDE],
  { source: ImageSourcePropType; rapport: number }
> = {
  [IMAGE_AIDE.RELEVE_ANNEXE]: {
    source: require('../../../assets/aides/releve-annexe-2025.png'),
    rapport: 915 / 439,
  },
  [IMAGE_AIDE.RELEVE_PAGE1]: {
    source: require('../../../assets/aides/releve-page1-2025.png'),
    rapport: 908 / 1284,
  },
  [IMAGE_AIDE.RELEVE_APR]: {
    source: require('../../../assets/aides/releve-apr-janvier-2026.png'),
    rapport: 844 / 149,
  },
  [IMAGE_AIDE.ICHN_ZONES]: {
    source: require('../../../assets/aides/ichn-corse-zonage-montants.png'),
    rapport: 721 / 685,
  },
  [IMAGE_AIDE.CLASSEMENT_COMMUNES]: {
    source: require('../../../assets/aides/classement-communes-zones.webp'),
    rapport: 2000 / 557,
  },
  [IMAGE_AIDE.DPB_TELEPAC]: {
    source: require('../../../assets/aides/telepac-dpb-portefeuille-2025.png'),
    rapport: 825 / 857,
  },
  [IMAGE_AIDE.LETTRE_DDT]: {
    source: require('../../../assets/aides/lettre-ddt-dpb-stabilisateur-2025.png'),
    rapport: 884 / 625,
  },
};
