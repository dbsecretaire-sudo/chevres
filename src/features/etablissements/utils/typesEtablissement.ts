import type { DonneesEtablissement } from '@/features/etablissements/repository';
import { ACTIVITES_ENTREPRISE, ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { LABEL_ACTIVITE_SOCIETE, LABEL_TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/textes/libelles';

/** Types d'un établissement sur une ligne (« Chèvres, Brebis, Association »), vide s'il n'en a aucun. */
export function libelleTypesEtablissement({ animaux = [], activites = [] }: DonneesEtablissement): string {
  return [
    ...animaux.map((a) => LABEL_TYPE_ANIMAL_ETABLISSEMENT[a]),
    // « Agriculture » va de soi quand l'établissement élève des animaux : on ne le répète pas.
    ...activites
      .filter((a) => !(a === ACTIVITE_SOCIETE.AGRICOLE && animaux.length > 0))
      .map((a) => LABEL_ACTIVITE_SOCIETE[a]),
  ].join(', ');
}

/** Ajoute la valeur à la sélection si elle n'y est pas, la retire sinon. */
export function basculer<T>(selection: T[], valeur: T): T[] {
  return selection.includes(valeur) ? selection.filter((v) => v !== valeur) : [...selection, valeur];
}

/** Vrai pour un établissement sans animaux dont un type est une activité d'entreprise (libéral, prestations, association). */
export function estEntreprise({
  animaux = [],
  activites = [],
}: Pick<DonneesEtablissement, 'animaux' | 'activites'>): boolean {
  return animaux.length === 0 && activites.some((a) => ACTIVITES_ENTREPRISE.includes(a));
}
