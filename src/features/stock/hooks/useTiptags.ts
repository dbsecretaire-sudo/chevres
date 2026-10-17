import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { numerosTiptag } from '@/features/stock/services/boucles';

/** Les numéros des tiptag de l'inventaire (de l'espèce active), relus à chaque ouverture de l'écran : la règle d'or des cabris à l'abattoir. */
export function useTiptags(): ReadonlySet<string> {
  const [tiptags, setTiptags] = useState<ReadonlySet<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then((archive) => setTiptags(numerosTiptag(archive.boucles)))
        .catch(() => undefined);
    }, []),
  );
  return tiptags;
}
