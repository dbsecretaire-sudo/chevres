import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { FiltresTransactions } from '@/features/comptabilite/components/FiltreTransactionsModal';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import {
  FILTRES_VIDES,
  TOUTES_ACTIVITES,
  calculerSoldes,
  filtrerParActivite,
  filtrerTransactions,
  filtresSontActifs,
  type FiltreActivite,
} from '@/features/comptabilite/services/filtresTransactions';
import { listTransactions, type Transaction } from '@/features/comptabilite/services/transactions';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { especeCourante, plusieursEspeces } from '@/shared/dictionnaire/animaux';

/** Transactions de l'année active, par activité, filtrées et recherchées, avec leurs soldes. */
export function useListeTransactions() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtres, setFiltres] = useState<FiltresTransactions>(FILTRES_VIDES);
  const [filtreOuvert, setFiltreOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreActivite, setFiltreActivite] = useState<FiltreActivite>(
    plusieursEspeces() ? especeCourante() : TOUTES_ACTIVITES,
  );

  const charger = useCallback(async () => {
    const [toutesAnnees, liste] = await Promise.all([
      toutesLesAnneesConnues(),
      listTransactions(settings.anneeActive),
    ]);
    setAnnees(toutesAnnees);
    setTransactions(liste);
  }, [settings.anneeActive]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const filtrees = useMemo(
    () => filtrerTransactions(filtrerParActivite(transactions, filtreActivite), filtres, recherche),
    [transactions, filtreActivite, filtres, recherche],
  );

  return {
    filtreActivite,
    setFiltreActivite,
    anneeActive: settings.anneeActive,
    setAnneeActive,
    annees,
    filtrees,
    soldes: calculerSoldes(filtrees),
    filtres,
    setFiltres,
    effacerFiltres: () => setFiltres(FILTRES_VIDES),
    filtresActifs: filtresSontActifs(filtres),
    filtreOuvert,
    setFiltreOuvert,
    recherche,
    setRecherche,
  };
}
