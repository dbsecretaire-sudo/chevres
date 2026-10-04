import { vocabulaire } from '@/shared/dictionnaire/animaux';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';

const V = vocabulaire;

/** Textes de l'interface — « sauvegarde ». À modifier ici uniquement. */
export const TEXTES_SAUVEGARDE = {
  backup: {
    get sauvegardeTroupeauChevres() {
      return modeEntreprise() ? 'Sauvegarde de l’entreprise' : `Sauvegarde ${V().troupeau}`;
    },
    ceFichierNEstPas: 'Ce fichier n’est pas une sauvegarde valide (JSON illisible).',
    ceFichierNEstPasUne: 'Ce fichier n’est pas une sauvegarde valide.',
  },
} as const;
