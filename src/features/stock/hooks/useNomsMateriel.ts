import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

/** Les noms du matériel (grillage, poteaux…) et de l'équipement consommable (gants…) du stock, relus à chaque retour sur l'écran. */
export function useNomsMateriel(): { materiel: Set<string>; equipement: Set<string> } {
  const [noms, setNoms] = useState({ materiel: new Set<string>(), equipement: new Set<string>() });

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) =>
        setNoms({
          materiel: new Set(articlesDuGenre(GENRE_ARTICLE.BATIMENT, archive).map((a) => a.libelle)),
          equipement: new Set(articlesDuGenre(GENRE_ARTICLE.EQUIPEMENT, archive).map((a) => a.libelle)),
        }),
      );
    }, []),
  );

  return noms;
}
