import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { EtiquettesSimple } from '@/features/production/simple/EtiquettesSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** « Imprimer des étiquettes » en très grands boutons : ouvert d'un appui sur la tuile de l'atelier. */
export default function EcranEtiquettesSimple() {
  const router = useRouter();
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: TEXTES.accueil.ferme.terrain.tuiles.etiquettes }} />
      <View style={styles.page}>
        <EtiquettesSimple presentation="tuiles" onTerminer={() => retournerALaPageDAvant(router)} />
      </View>
    </AccentColorProvider>
  );
}
