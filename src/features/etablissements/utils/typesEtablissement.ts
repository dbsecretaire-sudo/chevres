import type { DonneesEtablissement } from '@/features/etablissements/repository';
import {
  ACTIVITES_ENTREPRISE,
  ACTIVITE_SOCIETE,
  ICONE_ACTIVITE_SOCIETE,
  ICONE_ETABLISSEMENT_PAR_DEFAUT,
} from '@/shared/constants/etablissements';
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

/**
 * Le logo d'un établissement : la patte quand il élève des animaux, sinon celui de sa première activité (le lit pour un gîte, le
 * dossier pour un secrétariat…).
 */
export function iconeEtablissement({
  animaux = [],
  activites = [],
}: Pick<DonneesEtablissement, 'animaux' | 'activites'>): string {
  if (animaux.length > 0) return ICONE_ACTIVITE_SOCIETE[ACTIVITE_SOCIETE.AGRICOLE];
  const activite = activites.find((a) => a in ICONE_ACTIVITE_SOCIETE);
  return activite ? ICONE_ACTIVITE_SOCIETE[activite] : ICONE_ETABLISSEMENT_PAR_DEFAUT;
}
