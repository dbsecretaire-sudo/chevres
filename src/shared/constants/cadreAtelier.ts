/** Les démarches réglementaires de l'atelier (fromages, viande, charcuterie, plats) : ce que l'éleveur coche, date et justifie par des pièces. */
export const ETAPE_ATELIER = {
  DECLARATION_ACTIVITE: 'declaration_activite',
  AGREMENT: 'agrement',
  PMS: 'pms',
  ANALYSES: 'analyses',
  SANTE_TROUPEAU: 'sante_troupeau',
  ETIQUETAGE: 'etiquetage',
  VIANDE: 'viande',
  SAVON: 'savon',
  PLATS: 'plats',
  VENTE_DIRECTE: 'vente_directe',
  BROCCIU: 'brocciu',
  CORSE: 'corse',
} as const;

/** Dans l'ordre où on les fait : les démarches obligatoires d'abord, puis celles à vérifier. */
export const ETAPES_ATELIER: readonly string[] = [
  ETAPE_ATELIER.DECLARATION_ACTIVITE,
  ETAPE_ATELIER.PMS,
  ETAPE_ATELIER.ANALYSES,
  ETAPE_ATELIER.SANTE_TROUPEAU,
  ETAPE_ATELIER.ETIQUETAGE,
  ETAPE_ATELIER.AGREMENT,
  ETAPE_ATELIER.VIANDE,
  ETAPE_ATELIER.SAVON,
  ETAPE_ATELIER.PLATS,
  ETAPE_ATELIER.VENTE_DIRECTE,
  ETAPE_ATELIER.BROCCIU,
  ETAPE_ATELIER.CORSE,
];

/** Celles que tout atelier doit avoir faites ; les autres dépendent de ce qu'on fabrique et de qui l'on livre. */
export const ETAPES_ATELIER_OBLIGATOIRES: readonly string[] = [
  ETAPE_ATELIER.DECLARATION_ACTIVITE,
  ETAPE_ATELIER.PMS,
  ETAPE_ATELIER.ANALYSES,
  ETAPE_ATELIER.SANTE_TROUPEAU,
  ETAPE_ATELIER.ETIQUETAGE,
];
