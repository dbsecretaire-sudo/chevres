import type { TypeAliment } from '@/features/comptabilite/types';
import { TYPE_ALIMENT, TYPES_ALIMENT_PAR_ESPECE } from '@/shared/constants/comptabilite';
import { especeCourante, type EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** Aliments proposés pour une espèce (celle de l'espèce courante par défaut). */
export const typesAlimentEspece = (espece: EspeceAnimale = especeCourante()): readonly TypeAliment[] =>
  TYPES_ALIMENT_PAR_ESPECE[espece];

/** Les mêmes, sans « Autre » : ceux qui entrent dans les totaux et moyennes par animal. */
export const typesAlimentComptabilisesEspece = (espece: EspeceAnimale = especeCourante()): TypeAliment[] =>
  typesAlimentEspece(espece).filter((t) => t !== TYPE_ALIMENT.AUTRE);
