import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/shared/components/Screen';
import { LaitParFromage } from '@/features/stock/components/LaitParFromage';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';

/** Les statistiques du stock, sur un écran à part : le lait qu'il faut par fromage, mois par mois. */
export default function StatistiquesStockEcran() {
  const [archive, setArchive] = useState<ArchiveStock | null>(null);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then(setArchive);
    }, []),
  );

  return <Screen>{archive ? <LaitParFromage archive={archive} /> : null}</Screen>;
}
