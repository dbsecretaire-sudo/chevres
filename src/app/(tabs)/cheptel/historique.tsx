import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Badge } from '@/components/Badge';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { SelectField } from '@/components/SelectField';
import { statutColors } from '@/theme/colors';
import { listChevresHistorique } from '@/storage/repositories';
import type { Chevre } from '@/types/models';
import { formatDateFR } from '@/utils/dates';
import { libelleChevre, statutLabel } from '@/utils/chevreLabel';

type Tri = 'sortie' | 'naissance' | 'boucle';

const OPTIONS_TRI: { value: Tri; label: string }[] = [
  { value: 'sortie', label: 'Date de sortie' },
  { value: 'naissance', label: 'Date de naissance' },
  { value: 'boucle', label: 'N° de boucle' },
];

function compareBoucle(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b);
}

export default function Historique() {
  const router = useRouter();
  const [chevres, setChevres] = useState<Chevre[]>([]);
  const [tri, setTri] = useState<Tri>('sortie');

  useFocusEffect(
    useCallback(() => {
      listChevresHistorique().then(setChevres);
    }, []),
  );

  const triees = useMemo(() => {
    return [...chevres].sort((a, b) => {
      if (tri === 'naissance') return b.dateNaissance.localeCompare(a.dateNaissance);
      if (tri === 'boucle') return compareBoucle(a.numeroBoucle, b.numeroBoucle);
      return (b.dateStatut ?? '').localeCompare(a.dateStatut ?? '');
    });
  }, [chevres, tri]);

  return (
    <Screen scroll={false}>
      <View style={styles.filtre}>
        <SelectField label="Trier par" value={tri} onChange={setTri} options={OPTIONS_TRI} />
      </View>
      <FlatList
        data={triees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucun historique"
            subtitle="Les chèvres mortes, envoyées à l'abattoir ou vendues apparaîtront ici, tout en restant enregistrées."
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={libelleChevre(item)}
            subtitle={`${statutLabel(item.statut, item.sexe)} le ${formatDateFR(item.dateStatut)}`}
            trailing={<Badge label={statutLabel(item.statut, item.sexe)} color={statutColors[item.statut]} />}
            onPress={() => router.push(`/cheptel/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filtre: { paddingHorizontal: 16, paddingTop: 12 },
  list: { padding: 16, gap: 10 },
});
