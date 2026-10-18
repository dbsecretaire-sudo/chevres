import { useEffect, useMemo, useState } from 'react';
import { listChevresPresentesLe } from '@/features/cheptel/repository/chevres';
import { parentsPossiblesLe } from '@/features/cheptel/services/meresPossibles';
import { libelleChevre } from '@/features/cheptel/utils/chevreLabel';
import type { Chevre } from '@/features/cheptel/types';
import { SEXE } from '@/shared/constants/cheptel';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { todayISO } from '@/shared/utils/dates';

/** Les parents possibles (mères ou pères) pour une liste déroulante, d'après la date de naissance du petit ; sans date, ceux d'aujourd'hui (voir parentsPossiblesLe). */
export function useParentsPossibles(date: string, sexe: ValeurDe<typeof SEXE>, incluse?: string) {
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
      parentsPossiblesLe(presentes, jour, sexe, incluse).map((c) => ({
        value: c.numeroBoucle as string,
        label: libelleChevre(c),
      })),
    [presentes, jour, sexe, incluse],
  );
}

/** Les mères possibles pour une liste déroulante. */
export const useMeresPossibles = (date: string, incluse?: string) => useParentsPossibles(date, SEXE.FEMELLE, incluse);
