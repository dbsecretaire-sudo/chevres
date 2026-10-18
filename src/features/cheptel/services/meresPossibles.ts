import type { Chevre } from '@/features/cheptel/types';
import { SEXE, agePetitMax } from '@/shared/constants/cheptel';
import { ageAtteint } from '@/shared/utils/age';

/**
 * Les mères possibles d'un petit né à une date : les femelles (jamais les boucs) avec un n° de boucle, présentes sur l'exploitation ce
 * jour-là (nées avant, pas encore sorties — une chèvre vendue ou morte depuis y figure) et qui avaient atteint la maturité sexuelle
 * (l'âge de petit de l'espèce, 6 mois). `incluse` est une mère qui y figure toujours (celle déjà choisie, ou donnée à l'ouverture de l'écran).
 */
export function meresPossiblesLe(presentes: Chevre[], date: string, incluse?: string): Chevre[] {
  const maturite = agePetitMax();
  return presentes.filter(
    (c) =>
      c.sexe === SEXE.FEMELLE &&
      !!c.numeroBoucle &&
      (c.numeroBoucle === incluse || (!!c.dateNaissance && ageAtteint(c.dateNaissance, maturite, date))),
  );
}
