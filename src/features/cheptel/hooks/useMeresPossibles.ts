import { useEffect, useMemo, useState } from 'react';
import { listChevresPresentesLe } from '@/features/cheptel/repository/chevres';
import { meresPossiblesLe } from '@/features/cheptel/services/meresPossibles';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { todayISO } from '@/shared/utils/dates';

/** Les mères possibles pour une liste déroulante, d'après la date de naissance du petit (celle de la mise bas) ; sans date, celles d'aujourd'hui (voir meresPossiblesLe). */
export function useMeresPossibles(date: string, incluse?: string) {
  const jour = date || todayISO();
  const [presentes, setPresentes] = useState<Chevre[]>([]);
  useEffect(() => {
    let actuel = true;
    listChevresPresentesLe(jour).then((liste) => {
      if (actuel) setPresentes(liste);
    });
    return () => {
      actuel = false;
    };
  }, [jour]);

  return useMemo(
    () =>
      meresPossiblesLe(presentes, jour, incluse).map((c) => ({
        value: c.numeroBoucle as string,
        label: libelleChevre(c),
      })),
    [presentes, jour, incluse],
  );
}
