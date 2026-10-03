import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/**
 * Dictionnaire des animaux : le vocabulaire de l'application (femelle, mâle, petit…) selon l'espèce
 * de l'établissement. La logique est la même pour toutes les espèces, seuls les mots changent.
 * Pour ajouter une espèce ou changer un mot, c'est ici uniquement.
 */

export type EspeceAnimale = ValeurDe<typeof TYPE_ANIMAL_ETABLISSEMENT>;

export interface Terme {
  singulier: string;
  pluriel: string;
}

export interface Vocabulaire {
  /** Nom du troupeau dans les titres d'export et de sauvegarde. */
  troupeau: string;
  femelle: Terme;
  male: Terme;
  /** Le petit, quel que soit son sexe (cabri, agneau, veau, porcelet). */
  petit: Terme;
  /** Le petit sans boucle, selon son sexe, tel qu'affiché dans les listes (singulier, avec majuscule). */
  petitFemelle: string;
  petitMale: string;
}

const terme = (singulier: string, pluriel = `${singulier}s`): Terme => ({ singulier, pluriel });

export const DICTIONNAIRE_ANIMAUX: Record<EspeceAnimale, Vocabulaire> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: {
    troupeau: 'Troupeau Chèvres',
    femelle: terme('chèvre'),
    male: terme('bouc'),
    petit: terme('cabri'),
    petitFemelle: 'Chevrette',
    petitMale: 'Chevreau',
  },
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: {
    troupeau: 'Troupeau Brebis',
    femelle: terme('brebis', 'brebis'),
    male: terme('bélier'),
    petit: terme('agneau', 'agneaux'),
    petitFemelle: 'Agnelle',
    petitMale: 'Agneau',
  },
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: {
    troupeau: 'Troupeau Vaches',
    femelle: terme('vache'),
    male: terme('taureau', 'taureaux'),
    petit: terme('veau', 'veaux'),
    petitFemelle: 'Génisse',
    petitMale: 'Veau',
  },
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: {
    troupeau: 'Troupeau Cochons',
    femelle: terme('truie'),
    male: terme('verrat'),
    petit: terme('porcelet'),
    petitFemelle: 'Cochette',
    petitMale: 'Porcelet',
  },
};

/** Vocabulaire neutre, quand l'établissement élève plusieurs espèces à la fois. */
export const VOCABULAIRE_GENERIQUE: Vocabulaire = {
  troupeau: 'Troupeau',
  femelle: terme('femelle'),
  male: terme('mâle'),
  petit: terme('jeune'),
  petitFemelle: 'Jeune',
  petitMale: 'Jeune',
};

/** Espèce utilisée tant qu'aucune n'est renseignée (établissements créés avant l'ajout du type). */
export const ESPECE_PAR_DEFAUT: EspeceAnimale = TYPE_ANIMAL_ETABLISSEMENT.CHEVRES;

let especesActives: EspeceAnimale[] = [];

/** À appeler à chaque changement d'établissement actif, ou de ses animaux. */
export function definirEspecesActives(especes: EspeceAnimale[] | undefined): void {
  especesActives = especes ?? [];
}

/** Vocabulaire de l'établissement actif : celui de son espèce, neutre s'il en a plusieurs. */
export function vocabulaire(): Vocabulaire {
  if (especesActives.length === 0) return DICTIONNAIRE_ANIMAUX[ESPECE_PAR_DEFAUT];
  if (especesActives.length > 1) return VOCABULAIRE_GENERIQUE;
  return DICTIONNAIRE_ANIMAUX[especesActives[0]];
}

/** Le terme au singulier ou au pluriel selon le nombre. */
export const accorder = (t: Terme, nombre: number): string => (nombre > 1 ? t.pluriel : t.singulier);

export const capitaliser = (texte: string): string => texte.charAt(0).toUpperCase() + texte.slice(1);

/** « de cabris » / « d'agneaux » : le « de » s'élide devant une voyelle ou un h muet. */
export const de = (mot: string): string => (/^[aeiouyhéèêàâîô]/i.test(mot) ? `d’${mot}` : `de ${mot}`);

/** « ce bouc » / « cet agneau » : « ce » devient « cet » devant une voyelle ou un h muet (mots masculins). */
export const ce = (mot: string): string => (/^[aeiouyhéèêàâîô]/i.test(mot) ? `cet ${mot}` : `ce ${mot}`);

/** Espèce dont dépendent les seuils métier : celle de l'établissement, l'espèce par défaut s'il en a plusieurs ou aucune. */
export function especeActive(): EspeceAnimale {
  return especesActives.length === 1 ? especesActives[0] : ESPECE_PAR_DEFAUT;
}
