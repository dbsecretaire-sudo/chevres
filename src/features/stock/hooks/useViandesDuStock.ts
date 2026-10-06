import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, type ArticleAffiche, type FiltreStock } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

/** Les types de viande et de charcuterie du stock pour une espèce (ou tous), dans l'ordre choisi. */
export function useViandesDuStock(filtre?: FiltreStock): ArticleAffiche[] {
  const [viandes, setViandes] = useState<ArticleAffiche[]>([]);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) =>
        setViandes(articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, filtre)),
      );
    }, [filtre]),
  );

  return viandes;
}
