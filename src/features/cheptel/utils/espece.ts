import type { Chevre } from '@/features/cheptel/types';
import { especeCourante, especeParDefaut, type EspeceAnimale } from '@/shared/dictionnaire/animaux';

/** Espèce d'un animal : celle de sa fiche, ou l'espèce par défaut de l'établissement pour les fiches plus anciennes. */
export const especeDe = (c: Pick<Chevre, 'espece'>): EspeceAnimale => c.espece ?? especeParDefaut();

/** Garde les animaux de l'espèce courante. */
export const deEspeceCourante = <T extends Pick<Chevre, 'espece'>>(animaux: T[]): T[] =>
  animaux.filter((c) => especeDe(c) === especeCourante());
