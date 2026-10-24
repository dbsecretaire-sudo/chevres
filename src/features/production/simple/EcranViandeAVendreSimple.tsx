import { Stack } from 'expo-router';
import { View } from 'react-native';
import { ViandeAVendreSimple } from '@/features/production/simple/ViandeAVendreSimple';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** « Viande à vendre » en tuiles : ouvert d'un appui sur la tuile de l'atelier. */
export default function EcranViandeAVendreSimple() {
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: TEXTES.accueil.ferme.terrain.tuiles.viandeAVendre }} />
      <View style={styles.page}>
        <ViandeAVendreSimple />
      </View>
    </AccentColorProvider>
  );
}
