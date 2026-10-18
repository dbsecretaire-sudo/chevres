import type { Chevre } from '@/features/cheptel/types';
import { SEXE, agePetitMax } from '@/shared/constants/cheptel';
import { ageAtteint } from '@/shared/utils/age';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/**
 * Les parents possibles d'un petit né à une date : les animaux du sexe voulu (une femelle pour la mère, un mâle pour le père) avec un n° de
 * boucle, présents sur l'exploitation ce jour-là (nés avant, pas encore sortis — un animal vendu ou mort depuis y figure) et qui avaient
 * atteint la maturité sexuelle (l'âge de petit de l'espèce, 6 mois). `incluse` est un parent qui y figure toujours (celui déjà choisi).
 */
export function parentsPossiblesLe(
  presentes: Chevre[],
  date: string,
  sexe: ValeurDe<typeof SEXE>,
  incluse?: string,
): Chevre[] {
  const maturite = agePetitMax();
  return presentes.filter(
    (c) =>
      c.sexe === sexe &&
      !!c.numeroBoucle &&
      (c.numeroBoucle === incluse || (!!c.dateNaissance && ageAtteint(c.dateNaissance, maturite, date))),
  );
}

/** Les mères possibles : les femelles (jamais les boucs) — voir parentsPossiblesLe. */
export const meresPossiblesLe = (presentes: Chevre[], date: string, incluse?: string): Chevre[] =>
  parentsPossiblesLe(presentes, date, SEXE.FEMELLE, incluse);
