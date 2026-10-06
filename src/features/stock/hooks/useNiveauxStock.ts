import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { niveauxDeStock } from '@/features/stock/services/stock';

/** Le niveau de chaque article du stock (par identifiant « genre:code »), relu à chaque retour sur l'écran. */
export function useNiveauxStock(): Map<string, number> {
  const [niveaux, setNiveaux] = useState<Map<string, number>>(new Map());

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) => setNiveaux(niveauxDeStock(archive.mouvements)));
    }, []),
  );

  return niveaux;
}
