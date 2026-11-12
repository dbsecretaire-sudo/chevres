






import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { especeCourante } from '@/shared/dictionnaire/animaux';



/** Le dessin d'un animal de l'enclos, selon l'espèce de l'établissement (un dessin simple, remplaçable par une illustration). */
const DESSIN_PAR_ESPECE: Record<string, string> = {
  [TYPE_ANIMAL_ETABLISSEMENT.CHEVRES]: '🐐',
  [TYPE_ANIMAL_ETABLISSEMENT.BREBIS]: '🐑',
  [TYPE_ANIMAL_ETABLISSEMENT.POULES]: '🐔',
  [TYPE_ANIMAL_ETABLISSEMENT.COCHONS]: '🐖',
  [TYPE_ANIMAL_ETABLISSEMENT.VACHES]: '🐄',
  [TYPE_ANIMAL_ETABLISSEMENT.DOMESTIQUES]: '🐕',
};

/** Le dessin de l'espèce de l'établissement (la tête de chaque animal de la liste de la chèvrerie). */
export const dessinDeLEspece = (): string => DESSIN_PAR_ESPECE[especeCourante()] ?? '🐐';
