import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/ScreenList';
import { ListRow } from '@/components/ListRow';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { Fab } from '@/components/Fab';
import { listClients } from '@/storage/clients';
import type { Client } from '@/types/models';

export default function ClientsIndex() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setClients(await listClients());
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.nom, c.prenom, c.telephone, c.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [clients, recherche]);

  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <FormField
          label="Rechercher"
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Nom, téléphone, email…"
        />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucun client"
            subtitle="Ajoutez vos clients pour les retrouver rapidement dans une nouvelle vente."
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={`${item.nom}${item.prenom ? ` ${item.prenom}` : ''}`}
            subtitle={[item.telephone, item.email].filter(Boolean).join(' · ') || undefined}
            onPress={() => router.push(`/comptabilite/clients/${item.id}`)}
          />
        )}
      />

      <Fab options={[{ label: 'Nouveau client', icon: 'add', onPress: () => router.push('/comptabilite/clients/nouveau') }]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 16, paddingTop: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 160, paddingTop: 4, gap: 10 },
});
