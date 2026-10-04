import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { listElements } from '@/features/dossiers/repository';
import type { Element } from '@/features/dossiers/types';
import { listSejours } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { listTransactions } from '@/features/comptabilite/services/transactions';
import {
  calculerSoldes,
  type SoldesTransactions,
} from '@/features/comptabilite/services/filtresTransactions';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

export interface BalanceMois {
  /** De 1 (janvier) à 12 (décembre). */
  mois: number;
  recettes: number;
  depenses: number;
  solde: number;
}

/**
 * Ce que l'accueil d'une entreprise affiche : les séjours du gîte et les contenus (dont les tâches à échéance) pour le
 * calendrier, et l'état des finances de l'année active (total et mois par mois) pour la balance.
 */
export function useAccueilEntreprise() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [balance, setBalance] = useState<SoldesTransactions | null>(null);
  const [parMois, setParMois] = useState<BalanceMois[]>([]);

  const charger = useCallback(async () => {
    const [toutesAnnees, listeSejours, listeElements, transactions] = await Promise.all([
      toutesLesAnneesConnues(),
      listSejours(),
      listElements(),
      listTransactions(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setSejours(listeSejours);
    setElements(listeElements);
    setBalance(calculerSoldes(transactions));
    setParMois(
      Array.from({ length: 12 }, (_, i) => {
        const soldes = calculerSoldes(transactions.filter((t) => Number(t.date.slice(5, 7)) === i + 1));
        return {
          mois: i + 1,
          recettes: soldes.totalRentrees,
          depenses: soldes.totalDepenses,
          solde: soldes.balance,
        };
      }),
    );
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  return { annee: settings.anneeActive, annees, setAnneeActive, sejours, elements, balance, parMois };
}
