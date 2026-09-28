import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/ScreenList';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { Fab } from '@/components/Fab';
import { listComptesPcg, type CompteComptableEnregistre } from '@/storage/comptesPcg';

export default function ComptesPcgIndex() {
  const router = useRouter();
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setComptes(await listComptesPcg());
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return comptes;
    return comptes.filter((c) => [c.numero, c.libelle].some((v) => v?.toLowerCase().includes(q)));
  }, [comptes, recherche]);

  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <FormField
          label="Rechercher"
          value={recherche}
          onChangeText={setRecherche}
          placeholder="N° ou libellé…"
        />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucun compte"
            subtitle="Ajoutez des comptes PCG pour les retrouver rapidement dans une nouvelle écriture."
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.numero}
            subtitle={item.libelle}
            onPress={() => router.push(`/comptabilite/comptes-pcg/${item.id}`)}
          />
        )}
      />

      <Fab options={[{ label: 'Nouveau compte', icon: 'add', onPress: () => router.push('/comptabilite/comptes-pcg/nouveau') }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingTop: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 160, paddingTop: 4, gap: 10 },
});
