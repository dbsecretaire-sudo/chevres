import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { ROUTES } from '@/shared/constants/routes';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.didacticiel;

/**
 * Le didacticiel sur l'accueil : une case l'active ou le désactive (propre à chaque établissement). Activé, il propose de parcourir toutes les
 * options de l'application ; désactivé, il ne reste que la case, pour le rallumer.
 */
export function BlocDidacticiel() {
  const router = useRouter();
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const actif = !infos?.didacticielMasque;
  return (
    <Card style={commonStyles.gap8}>
      <View style={commonStyles.rowSpaceBetween}>
        <Text style={commonStyles.cardTitle}>{T.titre}</Text>
      </View>
      <Checkbox
        label={T.afficher}
        value={actif}
        onChange={(valeur) => patchSettings({ exploitation: { ...infos, didacticielMasque: valeur ? undefined : true } })}
      />
      {actif ? (
        <>
          <Text style={commonStyles.note}>{T.presentation}</Text>
          <Button variant="secondary" label={T.parcourir} onPress={() => router.push(ROUTES.DIDACTICIEL as never)} />
        </>
      ) : null}
    </Card>
  );
}
