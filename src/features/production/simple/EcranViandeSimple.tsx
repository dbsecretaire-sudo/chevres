import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ViandeSimple } from '@/features/production/simple/ViandeSimple';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** « Viande à facturer » en tuiles : ouvert d'un appui sur la tuile de l'atelier. */
export default function EcranViandeSimple() {
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: TEXTES.accueil.ferme.terrain.tuiles.viandeAFacturer }} />
      <View style={styles.page}>
        <ViandeSimple />
      </View>
    </AccentColorProvider>
  );
}
