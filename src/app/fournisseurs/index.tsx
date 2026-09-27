import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/ScreenList';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { Fab } from '@/components/Fab';
import { listFournisseurs } from '@/storage/fournisseurs';
import type { Fournisseur } from '@/types/models';

export default function FournisseursIndex() {
  const router = useRouter();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setFournisseurs(await listFournisseurs());
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return fournisseurs;
    return fournisseurs.filter((f) =>
      [f.nom, f.prenom, f.nomEntreprise, f.siret].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [fournisseurs, recherche]);

  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <FormField
          label="Rechercher"
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Nom, entreprise, SIRET…"
        />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucun fournisseur"
            subtitle="Ajoutez vos fournisseurs pour les retrouver rapidement dans une nouvelle facture."
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.nomEntreprise}
            subtitle={`${item.nom}${item.prenom ? ` ${item.prenom}` : ''} · SIRET ${item.siret}`}
            onPress={() => router.push(`/fournisseurs/${item.id}`)}
          />
        )}
      />

      <Fab options={[{ label: 'Nouveau fournisseur', icon: 'add', onPress: () => router.push('/fournisseurs/nouveau') }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingTop: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 160, paddingTop: 4, gap: 10 },
});
