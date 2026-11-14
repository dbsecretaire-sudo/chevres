import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FiltresBoucles, TableauBoucles } from '@/features/stock/components/TableauBoucles';
import { useListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { Screen } from '@/shared/components/Screen';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Le tableau détaillé d'une sorte de boucles (boucles, boucles rouges, rebouclage, tiptag) : ses filtres, son tri et tous ses numéros,
 * sur une page à part. La sorte vient de l'adresse (son article de l'inventaire).
 */
export default function TableauBouclesSorte() {
  const { article = '' } = useLocalSearchParams<{ article?: string }>();
  const router = useRouter();
  const [stock, setStock] = useState<ArchiveStock | null>(null);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then(setStock)
        .catch(() => undefined);
    }, []),
  );
  const liste = useListeBoucles(stock?.boucles ?? [], article, stock?.mouvements ?? []);
  return (
    <Screen>
      <FiltresBoucles liste={liste} />
      <TableauBoucles
        liste={liste}
        pleinePage
        onOuvrirBoucle={(boucle) => router.push(ROUTES.bouclesDetail(article, boucle.numero) as never)}
      />
    </Screen>
  );
}
