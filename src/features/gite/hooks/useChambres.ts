import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listChambres } from '@/features/gite/repository';
import type { Chambre } from '@/features/gite/types';
import { CHAMBRES_PAR_DEFAUT } from '@/shared/constants/gite';

/** Les chambres du gîte (les six d'office tant qu'on n'en a pas ajouté), rechargées à chaque retour sur l'écran. */
export function useChambres(): { chambres: Chambre[]; recharger: () => void } {
  const [chambres, setChambres] = useState<Chambre[]>(CHAMBRES_PAR_DEFAUT);

  const recharger = useCallback(() => {
    listChambres().then(setChambres);
  }, []);

  useFocusEffect(recharger);

  return { chambres, recharger };
}
