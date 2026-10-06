import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuGenre, type ArticleAffiche } from '@/features/stock/services/stock';
import { GENRE_ARTICLE } from '@/shared/constants/stock';

/** Les fromages du stock, dans l'ordre choisi : ceux d'office et ceux ajoutés (leur nom reste libre). */
export function useFromagesDuStock(): ArticleAffiche[] {
  const [fromages, setFromages] = useState<ArticleAffiche[]>([]);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) => setFromages(articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive)));
    }, []),
  );

  return fromages;
}
