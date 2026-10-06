import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { listChambres, listSejours } from '@/features/gite/repository';
import type { Sejour } from '@/features/gite/types';
import { listTrades } from '@/features/trading/repository';
import type { Trade } from '@/features/trading/types';
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

const ARCHIVE_VIDE: ArchiveDossiers = { sousDossiers: [], elements: [] };

/**
 * Ce que l'accueil d'une entreprise affiche : les séjours du gîte, les contenus (dont les tâches à échéance) et leurs
 * dossiers, les trades du journal, et l'état des finances de l'année active (total et mois par mois) pour la balance.
 */
export function useAccueilEntreprise() {
  const { settings, setAnneeActive } = useAppSettings();
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [archive, setArchive] = useState<ArchiveDossiers>(ARCHIVE_VIDE);
  const [clients, setClients] = useState<Client[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [nombreChambres, setNombreChambres] = useState(0);
  const [balance, setBalance] = useState<SoldesTransactions | null>(null);
  const [parMois, setParMois] = useState<BalanceMois[]>([]);

  const charger = useCallback(async () => {
    const [toutesAnnees, listeSejours, chambres, archiveDossiers, listeClients, listeTrades, transactions] =
      await Promise.all([
        toutesLesAnneesConnues(),
        listSejours(),
        listChambres(),
        lireArchiveDossiers(),
        listClients(),
        listTrades(),
        listTransactions(settings.anneeActive),
      ]);
    setAnnees(toutesAnnees);
    setSejours(listeSejours);
    setNombreChambres(chambres.length);
    setArchive(archiveDossiers);
    setClients(listeClients);
    setTrades(listeTrades);
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

  return {
    annee: settings.anneeActive,
    annees,
    setAnneeActive,
    sejours,
    nombreChambres,
    elements: archive.elements,
    sousDossiers: archive.sousDossiers,
    clients,
    trades,
    balance,
    parMois,
    recharger: charger,
  };
}
