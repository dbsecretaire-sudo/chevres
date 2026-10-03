import { SEXE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';

/** Choix de sexe des listes déroulantes (chèvre, cabri). */
export const OPTIONS_SEXE = [
  { value: SEXE.FEMELLE, label: TEXTES.commun.general.femelle },
  { value: SEXE.MALE, label: TEXTES.commun.general.male },
];
