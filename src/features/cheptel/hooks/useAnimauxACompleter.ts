import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listTousLesAnimauxDeLEspece, saveChevre } from '@/features/cheptel/repository/chevres';
import { animauxACompleter, completee } from '@/features/cheptel/services/aCompleter';
import type { Chevre } from '@/features/cheptel/types';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';

/** Les animaux que le berger a saisis vite et qui restent à compléter (relus à chaque retour sur l'écran), et de quoi en marquer un comme complété. */
export function useAnimauxACompleter() {
  const { espece } = useEtablissement();
  const [animaux, setAnimaux] = useState<Chevre[]>([]);
  const recharger = useCallback(async () => setAnimaux(animauxACompleter(await listTousLesAnimauxDeLEspece())), []);
  useFocusEffect(
    useCallback(() => {
      recharger().catch(() => undefined);
      // L'espèce courante change ce qui est lu : la liste se relit avec elle.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recharger, espece]),
  );
  const marquerFait = async (animal: Chevre) => {
    await saveChevre(completee(animal));
    await recharger();
  };
  return { animaux, marquerFait };
}
