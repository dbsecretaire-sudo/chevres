import type { Chevre } from '@/features/cheptel/types';
import { SEXE } from '@/shared/constants/cheptel';

/** Les filtres de la liste du cheptel, dans l'ordre de l'écran. */
export type FiltreCheptel = 'toutes' | 'femelles' | 'males' | 'chevrettes';

const UN_AN_MS = 365 * 24 * 3600 * 1000;

/** Une chevrette : une femelle née il y a moins d'un an. */
export function estChevrette(animal: Pick<Chevre, 'sexe' | 'dateNaissance'>, aujourdhui: string): boolean {
  if (animal.sexe !== SEXE.FEMELLE || !animal.dateNaissance) return false;
  const naissance = new Date(`${animal.dateNaissance}T12:00:00`).getTime();
  const reference = new Date(`${aujourdhui}T12:00:00`).getTime();
  return reference - naissance < UN_AN_MS;
}

/** Les animaux d'un filtre, avec la recherche par boucle, dans l'ordre des numéros. */
export function filtrerCheptel(animaux: readonly Chevre[], filtre: FiltreCheptel, recherche: string, aujourdhui: string): Chevre[] {
  const texte = recherche.trim();
  return animaux
    .filter((animal) => {
      if (texte && !(animal.numeroBoucle ?? '').includes(texte)) return false;
      if (filtre === 'femelles') return animal.sexe === SEXE.FEMELLE;
      if (filtre === 'males') return animal.sexe === SEXE.MALE;
      if (filtre === 'chevrettes') return estChevrette(animal, aujourdhui);
      return true;
    })
    .sort((a, b) => (a.numeroBoucle ?? '').localeCompare(b.numeroBoucle ?? '', 'fr', { numeric: true }));
}

/** Les chiffres d'en-tête : les animaux vivants, et ceux nés dans l'année. */
export function chiffresCheptel(vivants: readonly Chevre[], annee: number): { vivantes: number; nees: number } {
  return {
    vivantes: vivants.length,
    nees: vivants.filter((animal) => (animal.dateNaissance ?? '').startsWith(String(annee))).length,
  };
}
