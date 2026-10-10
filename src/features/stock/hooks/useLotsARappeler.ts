import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { lotsARappeler, lotsRappelesAValider, validerRappelLot } from '@/features/stock/services/lots';
import { libelleArticle } from '@/features/stock/services/stock';
import { todayISO } from '@/shared/utils/dates';

/** Un rappel de lot lancé, qui attend sa validation. */
export interface RappelDeLot {
  id: string;
  /** « Frais · 1 » : le fromage ou le produit, et le n° du lot. */
  libelle: string;
  /** La date du rappel (AAAA-MM-JJ). */
  date: string;
}

/**
 * Les lots à rappeler (vendus, contrôle non ok : leur nombre) et les rappels déjà lancés à valider, relus à chaque retour sur
 * l'écran ; `valider` marque un rappel comme fait.
 */
export function useLotsARappeler() {
  const [aRappeler, setARappeler] = useState(0);
  const [aValider, setAValider] = useState<RappelDeLot[]>([]);
  const charger = useCallback(
    () =>
      lireArchiveStock().then((archive) => {
        setARappeler(lotsARappeler(archive).length);
        setAValider(
          lotsRappelesAValider(archive).map((l) => ({
            id: l.id,
            libelle: `${libelleArticle(l.article, archive)} · ${l.numero}`,
            date: l.dateRappel ?? '',
          })),
        );
      }),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );
  const valider = async (id: string) => {
    await validerRappelLot(id, todayISO());
    await charger();
  };
  return { aRappeler, aValider, valider };
}
