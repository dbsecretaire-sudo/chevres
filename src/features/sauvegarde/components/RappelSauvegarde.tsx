import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { lireSuiviSauvegarde, retardDeSauvegarde } from '@/features/sauvegarde/derniereSauvegarde';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.sauvegarde.rappel;

/**
 * Sur l'accueil : le rappel de faire une sauvegarde quand la dernière date de trop (ou qu'il n'y en a jamais eu). Les données sont
 * sur l'appareil seulement : une sauvegarde hors de l'appareil (fichier ou Google Drive) est ce qui les protège d'une panne ou d'une perte.
 */
export function RappelSauvegarde() {
  const router = useRouter();
  const [retard, setRetard] = useState<{ jours: number; jamais: boolean } | undefined>();

  useFocusEffect(
    useCallback(() => {
      const aujourdhui = todayISO();
      lireSuiviSauvegarde(aujourdhui)
        .then((suivi) => setRetard(retardDeSauvegarde(suivi, aujourdhui)))
        .catch(() => setRetard(undefined));
    }, []),
  );

  if (!retard) return null;
  return (
    <Card style={commonStyles.gap8}>
      <Text style={[commonStyles.lineBold, { color: colors.warning }]}>{T.titre}</Text>
      <Text style={commonStyles.note}>{retard.jamais ? T.jamais(retard.jours) : T.depuis(retard.jours)}</Text>
      <View>
        <Button label={T.bouton} onPress={() => router.push(ROUTES.SAUVEGARDE_LOCALE as never)} />
      </View>
    </Card>
  );
}
