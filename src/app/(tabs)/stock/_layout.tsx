import { Stack } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** Le stock : l'écran du stock, puis son historique et ses statistiques, ouverts par-dessus avec une flèche de retour. */
export default function StockLayout() {
  // Se réaffiche au changement d'espèce : les titres lisent le vocabulaire de l'espèce active.
  useEtablissement();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.stock.titre }} />
      <Stack.Screen name="stock-historique" options={{ title: TEXTES.stock.historique.titre }} />
      <Stack.Screen name="stock-statistiques" options={{ title: TEXTES.stock.statistiques.titre }} />
      <Stack.Screen name="structure" options={{ title: TEXTES.stock.structure.titre }} />
    </Stack>
  );
}
