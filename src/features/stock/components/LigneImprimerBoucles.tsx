import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exporterBouclesPdf } from '@/features/export/bouclesPdf';
import { useListesBoucles } from '@/features/stock/hooks/useListeBoucles';
import { lireArchiveStock } from '@/features/stock/repository';
import { bouclesDeLEspece } from '@/features/stock/services/boucles';
import type { BoucleStock, MouvementStock } from '@/features/stock/types';
import { ListRow } from '@/shared/components/ListRow';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** La ligne « Boucles » des documents : un appui imprime la liste des boucles de l'inventaire (celle qu'on garde pour un contrôle). */
export function LigneImprimerBoucles() {
  const [boucles, setBoucles] = useState<BoucleStock[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const listes = useListesBoucles(boucles, mouvements);
  useFocusEffect(
    useCallback(() => {
      lireArchiveStock()
        .then((stock) => {
          setBoucles(bouclesDeLEspece(stock.boucles));
          setMouvements(stock.mouvements);
        })
        .catch(() => undefined);
    }, []),
  );
  return (
    <ListRow
      title={TEXTES.production.lieux.documents.liens.boucles.titre}
      subtitle={TEXTES.production.lieux.documents.pageBoucles.imprimer}
      icone="pricetag"
      trailing={<Ionicons name="print-outline" size={24} color={colors.primary} />}
      onPress={() => exporterBouclesPdf(listes)}
    />
  );
}
