import type { DonneesEtablissement } from '@/features/etablissements/repository';
import { LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

/** Espèces élevées par un établissement sur une ligne (« Chèvres, Brebis »), vide s'il n'en a aucune. */
export function libelleTypesEtablissement({ animaux = [] }: Pick<DonneesEtablissement, 'animaux'>): string {
  return animaux.map((a) => LABEL_TYPE_ANIMAL_ETABLISSEMENT[a]).join(', ');
}

/** Ajoute la valeur à la sélection si elle n'y est pas, la retire sinon. */
export function basculer<T>(selection: T[], valeur: T): T[] {
  return selection.includes(valeur) ? selection.filter((v) => v !== valeur) : [...selection, valeur];
}
