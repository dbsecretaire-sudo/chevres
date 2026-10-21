import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Les documents du groupement sanitaire (GDS) que l'éleveur dépose : un fichier par document (le sien, scanné ou photographié). */
export const DOCUMENT_GDS = {
  ATTESTATION_PSE: 'attestation_pse',
  BONS_DELIVRANCE: 'bons_delivrance',
  BIOSECURITE: 'biosecurite',
  QUARANTAINE: 'quarantaine',
} as const;

export type DocumentGds = ValeurDe<typeof DOCUMENT_GDS>;

/** L'ordre dans lequel les documents se listent. */
export const DOCUMENTS_GDS: readonly DocumentGds[] = [
  DOCUMENT_GDS.ATTESTATION_PSE,
  DOCUMENT_GDS.BONS_DELIVRANCE,
  DOCUMENT_GDS.BIOSECURITE,
  DOCUMENT_GDS.QUARANTAINE,
];

/** L'antenne du GDS Corse pour la Haute-Corse : ses coordonnées, affichées sur la page du groupement sanitaire. */
export const ANTENNE_GDS_CORSE = {
  nom: 'GDS Corse — Antenne de Haute-Corse',
  adressePostale: 'RN 193, Lieu-dit Ortone, 20218 Ponte-Leccia',
  telephone: '04 95 46 39 78',
  email: 'gdsb2b@reseaugds.com',
  emailGeneral: 'gdscorse@reseaugds.com',
} as const;
