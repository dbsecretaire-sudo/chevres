import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { lireArchiveStock } from '@/features/stock/repository';
import { lignesDeVenteDeProduits, type ArticleAffiche, type FiltreStock } from '@/features/stock/services/stock';

/** Les types de viande et de charcuterie du stock pour une espèce (ou tous), dans l'ordre choisi, puis les plats préparés (qui se vendent comme la charcuterie). */
export function useViandesDuStock(filtre?: FiltreStock): ArticleAffiche[] {
  const [viandes, setViandes] = useState<ArticleAffiche[]>([]);

  useFocusEffect(
    useCallback(() => {
      lireArchiveStock().then((archive) =>
        setViandes(lignesDeVenteDeProduits(archive, filtre)),
      );
    }, [filtre]),
  );

  return viandes;
}
