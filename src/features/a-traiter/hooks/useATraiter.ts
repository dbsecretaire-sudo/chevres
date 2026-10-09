import { useEffect, useState } from 'react';
import type { ATraiter } from '@/features/a-traiter/types';
import { lireATraiter } from '@/features/a-traiter/services/aTraiter';
import type { Etablissement } from '@/features/etablissements/repository';
import { todayISO } from '@/shared/utils/dates';

/** Ce qui attend l'utilisateur dans tous ses établissements (relu quand la liste des établissements change). */
export function useATraiter(etablissements: Etablissement[]): ATraiter[] {
  const [items, setItems] = useState<ATraiter[]>([]);
  useEffect(() => {
    let actif = true;
    lireATraiter(etablissements, todayISO())
      .then((lus) => actif && setItems(lus))
      .catch(() => actif && setItems([]));
    return () => {
      actif = false;
    };
  }, [etablissements]);
  return items;
}
