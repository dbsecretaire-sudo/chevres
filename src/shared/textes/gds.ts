import { DOCUMENT_GDS } from '@/shared/constants/gds';

/** Textes du groupement sanitaire (GDS) : ses documents et son antenne. À modifier ici uniquement. */
export const TEXTES_GDS = {
  documents: {
    titre: 'Documents du GDS',
    titreRapports: 'Rapports d’essais',
    aideRapports: 'Les rapports d’essais du laboratoire (prophylaxie : brucellose, paratuberculose, Capra’Sana…) : déposez-les ici, un document par rapport. Un appui ouvre le fichier, le crayon le remplace, la poubelle le retire.',
    aide: 'Déposez vos propres documents (scan ou photo), autant que vous voulez : un appui ouvre le fichier, le crayon le remplace, la poubelle le retire.',
    depose: (date: string, heure: string) => `Déposé le ${date} à ${heure}`,
    manque: 'Pas encore déposé',
    ajouter: 'Ajouter un document',
    ajouterUnAutre: 'Ajouter un autre document',
    /** Sous les rubriques : les pages et guides de prévention du GDS. */
    prevention: {
      titre: 'Prévention : les guides du GDS',
      aide: 'Le GDS parle beaucoup de prévention : maladies d’élevage (CAEV, paratuberculose, fièvre Q), biosécurité, accueil du public à la ferme (précautions contre les zoonoses), qualité du lait cru. Déposez ici, dans les rubriques, ceux que vous gardez.',
      liens: [
        { titre: 'GDS France : prévention en élevage caprin (guides, biosécurité, accueil du public à la ferme)', url: 'https://www.gdsfrance.org/caprins/' },
        { titre: 'GDS France : l’action sanitaire, de l’élevage aux produits finis', url: 'https://www.gdsfrance.org/laction-sanitaire-de-lelevage-aux-produits-finis/' },
      ],
    },
    remplacer: 'Remplacer ce document',
    retirer: 'Retirer ce document',
    confirmerRetrait: 'Retirer ce document ?',
    messageRetrait: 'Le fichier sera effacé de l’appareil.',
    rubriques: {
      [DOCUMENT_GDS.RAPPORTS_ESSAIS]: {
        titre: 'Rapports d’essais du laboratoire',
        aide: 'Les résultats d’analyses de la prophylaxie (brucellose, paratuberculose, Capra’Sana…) : un document par rapport.',
      },
      [DOCUMENT_GDS.ATTESTATION_PSE]: {
        titre: 'Attestation d’adhésion au Plan Sanitaire d’Élevage',
        aide: 'La preuve de votre adhésion au PSE.',
      },
      [DOCUMENT_GDS.BONS_DELIVRANCE]: {
        titre: 'Bons de délivrance',
        aide: 'Les bons de délivrance de la pharmacie (avantages PSE).',
      },
      [DOCUMENT_GDS.BIOSECURITE]: {
        titre: 'Biosécurité : grille d’autodiagnostic',
        aide: 'Le document de biosécurité de l’élevage : la grille officielle d’autodiagnostic en biosécurité caprine, remplie.',
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
    documents: { titre: 'Documents du GDS', aide: 'Attestation PSE, bons de délivrance, biosécurité, quarantaine.' },
  },
} as const;
