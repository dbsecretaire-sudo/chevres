import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { FabricationSimple } from '@/features/production/simple/FabricationSimple';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** « Fabriquer » un fromage, de la charcuterie, un plat ou un savon (paramètre `produit`) : ouvert d'un appui sur la tuile de l'atelier. */
export default function EcranFabricationSimple() {
  const { produit } = useLocalSearchParams<{ produit?: string }>();
  const router = useRouter();
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      <Stack.Screen options={{ title: TEXTES.production.fabricationSimple.titre }} />
      <View style={styles.page}>
        <FabricationSimple
          produit={
            produit === PRODUIT_A_LOTS.CHARCUTERIE || produit === PRODUIT_A_LOTS.PLAT || produit === PRODUIT_A_LOTS.SAVON
              ? produit
              : PRODUIT_A_LOTS.FROMAGE
          }
          presentation="tuiles"
          onTerminer={() => retournerALaPageDAvant(router)}
        />
      </View>
    </AccentColorProvider>
  );
}
