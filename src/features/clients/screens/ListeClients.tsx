import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { FormField } from '@/shared/components/FormField';
import { Fab } from '@/shared/components/Fab';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function ClientsIndex() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async () => {
    setClients(await listClients());
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.nom, c.prenom, c.telephone, c.email].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [clients, recherche]);

  return (
    <Screen scroll={false}>
      <View style={commonStyles.topPadded}>
        <FormField
          label={TEXTES.commun.general.rechercher}
          value={recherche}
          onChangeText={setRecherche}
          placeholder={TEXTES.clients.listeClients.nomTelephoneEmailPoints}
        />
      </View>

      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listFab}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.clients.listeClients.aucunClient}
            subtitle={TEXTES.clients.listeClients.ajoutezVosClientsPourLes}
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={`${item.nom}${item.prenom ? ` ${item.prenom}` : ''}`}
            subtitle={[item.telephone, item.email].filter(Boolean).join(' · ') || undefined}
            onPress={() => router.push(ROUTES.ficheClient(item.id))}
          />
        )}
      />

      <Fab
        options={[
          {
            label: TEXTES.commun.general.nouveauClient,
            icon: 'add',
            onPress: () => router.push(ROUTES.CLIENT_NOUVEAU),
          },
        ]}
      />
    </Screen>
  );
}
