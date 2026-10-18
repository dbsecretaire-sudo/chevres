import { generateId } from '@/shared/utils/id';
import { estDateISO } from '@/shared/utils/dates';
import { SEXE } from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Un animal acheté tel que saisi dans une dépense « Animaux vivants » : sa fiche du cheptel se crée à l'enregistrement. */
export interface AnimalAcheteForm {
  key: string;
  /** Son n° de boucle (celui que lui a posé le vendeur) ; facultatif, il se complète dans la fiche. */
  boucle: string;
  sexe: ValeurDe<typeof SEXE>;
  /** Sa date de naissance (AAAA-MM-JJ). */
  naissance: string;
}

/** Un nouvel animal à saisir : une femelle, sans boucle ni naissance. */
export const animalAcheteVide = (): AnimalAcheteForm => ({
  key: generateId(),
  boucle: '',
  sexe: SEXE.FEMELLE,
  naissance: '',
});

/** Un animal est complet quand sa date de naissance est une vraie date. */
export const animalAcheteComplet = (a: AnimalAcheteForm): boolean => estDateISO(a.naissance);

/**
 * Les animaux achetés qu'on peut enregistrer, ou le message de ce qui manque : au moins un animal, chacun avec sa date de naissance, et
 * des boucles qui ne se répètent pas.
 */
export function controleDesAnimauxAchetes(
  animaux: AnimalAcheteForm[],
): { ok: true; animaux: AnimalAcheteForm[] } | { ok: false; erreur: 'aucun' | 'naissance' | 'boucleRepetee' } {
  if (animaux.length === 0) return { ok: false, erreur: 'aucun' };
  if (animaux.some((a) => !animalAcheteComplet(a))) return { ok: false, erreur: 'naissance' };
  const boucles = animaux.map((a) => a.boucle.trim()).filter(Boolean);
  if (new Set(boucles).size !== boucles.length) return { ok: false, erreur: 'boucleRepetee' };
  return { ok: true, animaux };
}
