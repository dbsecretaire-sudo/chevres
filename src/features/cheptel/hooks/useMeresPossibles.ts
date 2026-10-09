import { useEffect, useMemo, useState } from 'react';
import { listChevresVivantes } from '@/features/cheptel/repository/chevres';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { SEXE, agePetitMax } from '@/shared/constants/cheptel';
import { ageAtteint } from '@/shared/utils/age';

/**
 * Les mères possibles pour une liste déroulante : les femelles vivantes, avec un n° de boucle, qui avaient atteint la maturité
 * sexuelle à la date donnée (celle de la mise bas, ou de la naissance du petit). `incluse` est une mère qui y figure toujours
 * (celle déjà choisie, ou donnée à l'ouverture de l'écran).
 */
export function useMeresPossibles(date: string, incluse?: string) {
  const [vivantes, setVivantes] = useState<Chevre[]>([]);
  useEffect(() => {
    listChevresVivantes().then(setVivantes);
  }, []);

  return useMemo(() => {
    const maturite = agePetitMax();
    return vivantes
      .filter(
        (c) =>
          c.sexe === SEXE.FEMELLE &&
          !!c.numeroBoucle &&
          (ageAtteint(c.dateNaissance, maturite, date) || c.numeroBoucle === incluse),
      )
      .map((c) => ({ value: c.numeroBoucle as string, label: libelleChevre(c) }));
  }, [vivantes, date, incluse]);
}
