import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { LaitSimple } from '@/features/production/simple/LaitSimple';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** « Ajouter du lait » : les litres d'aujourd'hui, comme dans le mode normal. Ouvert d'un appui sur « Lait du jour » dans l'atelier. */
export default function EcranLaitSimple() {
  const router = useRouter();
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: TEXTES.stock.laitJour.ajouter }} />
      <View style={styles.page}>
        <LaitSimple onTerminer={() => retournerALaPageDAvant(router)} />
      </View>
    </AccentColorProvider>
  );
}
