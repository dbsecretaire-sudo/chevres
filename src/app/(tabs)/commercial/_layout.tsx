import { Stack } from 'expo-router';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

export default function CommercialLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.blanc,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: TEXTES.commercial.titre }} />
      <Stack.Screen name="ventes" options={{ title: TEXTES.commercial.ventes.titre }} />
      <Stack.Screen name="tarifs" options={{ title: TEXTES.commercial.tarifs.titre }} />
      <Stack.Screen name="commandes" options={{ title: TEXTES.commercial.commandes.titre }} />
      <Stack.Screen
        name="commande"
        options={({ route }) => ({
          title: (route.params as { id?: string } | undefined)?.id
            ? TEXTES.commercial.commandes.titre
            : TEXTES.commercial.commande.titreNouvelle,
        })}
      />
      <Stack.Screen name="circuits" options={{ title: TEXTES.commercial.circuits.titre }} />
    </Stack>
  );
}
