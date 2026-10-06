import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ListRow } from '@/shared/components/ListRow';
import { listTousLesSejours } from '@/features/gite/repository';
import { totalDuSejour } from '@/features/gite/services/tarifSejour';
import type { Sejour } from '@/features/gite/types';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/** Les réservations d'un client dans sa fiche : les plus récentes d'abord, chacune ouvre son séjour ; un « ! » signale un paiement en attente. */
export function ClientReservations({ clientId }: { clientId: string }) {
  const router = useRouter();
  const T = TEXTES.gite;
  const [sejours, setSejours] = useState<Sejour[]>([]);

  useFocusEffect(
    useCallback(() => {
      listTousLesSejours().then(setSejours);
    }, []),
  );

  const reservations = sejours
    .filter((s) => s.clientId === clientId)
    .sort((a, b) => b.arrivee.localeCompare(a.arrivee));

  return (
    <View style={commonStyles.gap10}>
      <Text style={commonStyles.cardTitle}>
        {T.reservationsClient.titre}
        {reservations.length > 0 ? ` (${reservations.length})` : ''}
      </Text>
      {reservations.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.reservationsClient.aucune}</Text>
      ) : (
        reservations.map((s) => (
          <ListRow
            key={s.id}
            grise={s.abandonne}
            title={T.jour.dates(formatDateShortFR(s.arrivee), formatDateShortFR(s.depart))}
            subtitle={
              s.abandonne
                ? T.reservationsClient.abandonnee
                : `${T.sejour.chambresListe(s.chambres)} · ${s.paye ? T.jour.paye : T.jour.aRegler}`
            }
            trailing={
              <View style={commonStyles.headerDroite}>
                {s.paye ? null : <Ionicons name="alert-circle" size={20} color={colors.danger} />}
                <Text style={[commonStyles.lineBold, s.abandonne && commonStyles.muted]}>
                  {formatMontant(totalDuSejour(s))}
                </Text>
              </View>
            }
            onPress={() => router.push(ROUTES.sejour(s.id))}
          />
        ))
      )}
    </View>
  );
}
