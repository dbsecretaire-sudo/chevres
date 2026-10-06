import { useCallback, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { ListRow } from '@/shared/components/ListRow';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { listSejours } from '@/features/gite/repository';
import { repasDuJour } from '@/features/gite/services/repas';
import type { Sejour } from '@/features/gite/types';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateFR } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/bar/Bar.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.bar.restauration;

/**
 * Les repas d'un jour : au-dessus, le total de repas à préparer (menu unique, midi et soir) ; dessous, chaque réservation
 * avec son nombre de repas et ses coordonnées.
 */
export default function RepasDuJour() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([listSejours(), listClients()]).then(([tous, fiches]) => {
        setSejours(tous);
        setClients(fiches);
      });
    }, []),
  );

  const reservations = repasDuJour(sejours, date);
  const total = reservations.reduce((somme, r) => somme + r.repas, 0);
  const midi = reservations.reduce((somme, r) => somme + r.midi, 0);
  const soir = reservations.reduce((somme, r) => somme + r.soir, 0);

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: T.repasDuJour(formatDateFR(date)) }} />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <Card>
          <Text style={styles.total}>{T.total(total)}</Text>
          {midi > 0 && soir > 0 ? (
            <Text style={commonStyles.muted}>{T.detailServices(midi, soir)}</Text>
          ) : null}
        </Card>
        {reservations.map(({ sejour, repas, midi: repasMidi, soir: repasSoir }) => {
          const client = clients.find((c) => c.id === sejour.clientId);
          const coordonnees = [client?.telephone, client?.email].filter(Boolean).join(' · ');
          return (
            <ListRow
              key={sejour.id}
              title={sejour.nom}
              subtitle={[T.service(repasMidi, repasSoir), coordonnees || T.sansCoordonnees]
                .filter(Boolean)
                .join(' · ')}
              trailing={<Text style={commonStyles.lineSemiBold}>{T.repas(repas)}</Text>}
              onPress={() => router.push(ROUTES.sejour(sejour.id))}
            />
          );
        })}
      </ScrollView>
    </Screen>
  );
}
