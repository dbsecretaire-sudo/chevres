import { DOCUMENT_GDS } from '@/shared/constants/gds';

/** Textes du groupement sanitaire (GDS) : ses documents et son antenne. À modifier ici uniquement. */
export const TEXTES_GDS = {
  documents: {
    titre: 'Documents du GDS',
    aide: 'Déposez votre propre document (scan ou photo) : il reste ici, avec la date de dépôt. Une ligne vide attend simplement son document.',
    depose: (date: string, heure: string) => `Déposé le ${date} à ${heure}`,
    manque: 'Pas encore déposé',
    deposer: 'Déposer le document',
    remplacer: 'Remplacer le document',
    ouvrir: 'Ouvrir',
    retirer: 'Retirer',
    rubriques: {
      [DOCUMENT_GDS.ATTESTATION_PSE]: {
        titre: 'Attestation d’adhésion au Plan Sanitaire d’Élevage',
        aide: 'La preuve de votre adhésion au PSE.',
      },
      [DOCUMENT_GDS.BONS_DELIVRANCE]: {
        titre: 'Bons de délivrance',
        aide: 'Les bons de délivrance de la pharmacie (avantages PSE).',
      },
      [DOCUMENT_GDS.BIOSECURITE]: {
        titre: 'Document de biosécurité',
        aide: 'Le document de biosécurité de l’élevage.',
      },
      [DOCUMENT_GDS.AUTODIAGNOSTIC]: {
        titre: 'Grille d’autodiagnostic en biosécurité caprine',
        aide: 'La grille officielle d’autodiagnostic, remplie.',
      },
      [DOCUMENT_GDS.QUARANTAINE]: {
        titre: 'Attestation de quarantaine',
        aide: 'Pour les animaux introduits dans le troupeau.',
      },
    },
  },
  antenne: {
    titre: 'Antenne du GDS',
    appeler: 'Appeler',
    ecrire: 'Écrire',
    ajouter: 'Ajouter aux contacts',
    ajoute: 'Ajouté aux contacts.',
    dejaAjoute: 'Cette antenne est déjà dans vos contacts.',
  },
  /** La page du lieu : ses rubriques (voir lieuxTiers). */
  lieu: {
    documents: { titre: 'Documents du GDS', aide: 'Attestation PSE, bons de délivrance, biosécurité, autodiagnostic, quarantaine.' },
  },
} as const;
